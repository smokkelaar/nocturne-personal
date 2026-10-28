using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Nocturne.Infrastructure.Data;
using Nocturne.Infrastructure.Data.Services;

namespace Nocturne.API.Tests.Integration.Infrastructure;

/// <summary>
/// Every context the API's <see cref="INocturneDbContextFactory"/> hands out during a request, with
/// its kind, its caller and whether the controller action had started.
/// </summary>
public sealed class ContextOpenLog
{
    private const string RequestIdHeader = "X-Context-Log-Id";
    private const string ActionStartedKey = "context-open-log:action-started";

    private readonly ConcurrentDictionary<string, ConcurrentQueue<ContextOpen>> _opens = new();
    private readonly IHttpContextAccessor _http;

    public ContextOpenLog(IHttpContextAccessor http) => _http = http;

    public sealed record ContextOpen(string Kind, string Caller, bool BeforeAction);

    /// <summary>Tags <paramref name="request"/> so its opens can be read back afterwards.</summary>
    public static string Tag(HttpRequestMessage request)
    {
        var id = Guid.NewGuid().ToString("N");
        request.Headers.Add(RequestIdHeader, id);
        return id;
    }

    public IReadOnlyList<ContextOpen> OpensOf(string requestId) =>
        _opens.TryGetValue(requestId, out var opens) ? opens.ToList() : [];

    /// <summary>
    /// Wraps the registered factory so every context it creates is logged against the request it
    /// was created for, and marks when each request's controller action starts.
    /// </summary>
    public static void Register(IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<ContextOpenLog>();
        services.Configure<MvcOptions>(options => options.Filters.Add(new ActionStartedFilter()));

        var inner = services.Last(d => d.ServiceType == typeof(INocturneDbContextFactory));
        services.Remove(inner);
        services.Add(ServiceDescriptor.Describe(
            typeof(INocturneDbContextFactory),
            sp => new LoggingFactory(
                (INocturneDbContextFactory)inner.ImplementationFactory!(sp),
                sp.GetRequiredService<ContextOpenLog>()),
            inner.Lifetime));
    }

    private void Record(string kind)
    {
        if (_http.HttpContext is not { } context
            || context.Request.Headers[RequestIdHeader].FirstOrDefault() is not { } id)
        {
            return;
        }

        var before = !context.Items.ContainsKey(ActionStartedKey);
        _opens.GetOrAdd(id, _ => new()).Enqueue(new ContextOpen(kind, CallerOf(new StackTrace()), before));
    }

    private static string CallerOf(StackTrace trace)
    {
        foreach (var frame in trace.GetFrames())
        {
            var type = frame.GetMethod()?.DeclaringType;
            var outer = type?.DeclaringType ?? type;
            if (outer?.Namespace is { } ns
                && ns.StartsWith("Nocturne.", StringComparison.Ordinal)
                && outer != typeof(ContextOpenLog)
                && outer != typeof(LoggingFactory)
                && !ns.StartsWith("Nocturne.API.Tests", StringComparison.Ordinal))
            {
                return type!.DeclaringType is not null ? $"{outer.Name}.{type.Name}" : $"{outer.Name}.{frame.GetMethod()!.Name}";
            }
        }

        return "?";
    }

    private sealed class ActionStartedFilter : IAsyncActionFilter, IOrderedFilter
    {
        public int Order => int.MinValue;

        public Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            context.HttpContext.Items[ActionStartedKey] = true;
            return next();
        }
    }

    private sealed class LoggingFactory(INocturneDbContextFactory inner, ContextOpenLog log) : INocturneDbContextFactory
    {
        public ValueTask<NocturneDbContext> CreateAsync(CancellationToken ct = default)
        {
            log.Record("scope");
            return inner.CreateAsync(ct);
        }

        public ValueTask<NocturneDbContext> CreateForTenantAsync(Guid tenantId, CancellationToken ct = default)
        {
            log.Record("tenant");
            return inner.CreateForTenantAsync(tenantId, ct);
        }

        public ValueTask<NocturneDbContext> CreateForSubjectAsync(Guid subjectId, CancellationToken ct = default)
        {
            log.Record("subject");
            return inner.CreateForSubjectAsync(subjectId, ct);
        }

        public ValueTask<NocturneDbContext> CreatePlatformAsync(CancellationToken ct = default)
        {
            log.Record("platform");
            return inner.CreatePlatformAsync(ct);
        }

        public ValueTask<NocturneDbContext> CreateSystemPinnedAsync(Guid tenantId, CancellationToken ct = default)
        {
            log.Record("system-pinned");
            return inner.CreateSystemPinnedAsync(tenantId, ct);
        }
    }
}
