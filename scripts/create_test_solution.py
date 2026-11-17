"""Create a CI solution without dotnet sln add's implicit project references."""

from collections import defaultdict
import os
from pathlib import Path
import sys
import xml.etree.ElementTree as ET


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit('Usage: create_test_solution.py OUTPUT PROJECT...')
    output = Path(sys.argv[1])
    projects = [Path(value) for value in sys.argv[2:]]
    if len(projects) != len(set(projects)) or any(not project.is_file() for project in projects):
        raise SystemExit('Each test project must exist and appear exactly once')

    groups = defaultdict(list)
    for project in projects:
        if len(project.parts) < 4 or project.parts[0] != 'tests':
            raise SystemExit(f'Unexpected test project path: {project}')
        groups[project.parts[1]].append(project)

    solution = ET.Element('Solution')
    for group in ('Unit', 'Integration', 'Parity'):
        if group not in groups:
            continue
        folder = ET.SubElement(solution, 'Folder', Name=f'/{group}/')
        for project in sorted(groups[group]):
            relative_path = os.path.relpath(project.resolve(), output.parent.resolve())
            ET.SubElement(folder, 'Project', Path=relative_path.replace(os.sep, '/'))
    if set(groups) - {'Unit', 'Integration', 'Parity'}:
        raise SystemExit('Unrecognized test project group')
    ET.indent(solution)
    output.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(solution).write(output, encoding='unicode')


if __name__ == '__main__':
    main()
