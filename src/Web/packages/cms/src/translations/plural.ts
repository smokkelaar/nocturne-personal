/**
 * The CMS's copy of the app's `plural` (packages/app/src/lib/utils/plural.ts), whose remarks
 * say how wuchale rewrites the call. The forms must be written inline at the call site.
 */
export function plural(
	n: number,
	forms: string[],
	rule: (n: number) => number = (count) => (count === 1 ? 0 : 1)
): string {
	const form = forms[rule(n)] ?? forms[forms.length - 1] ?? "";
	return form.replace("#", n.toLocaleString());
}
