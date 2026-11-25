#!/bin/sh
# Expand top-level placeholders from variables.yml so lychee checks the URLs
# readers see after the MkDocs build. Lychee runs this as: command PATH
set -eu

file=${1:?usage: expand-mkdocs-vars.sh FILE}

script_dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
vars_file=$root/variables.yml

if [ ! -f "$vars_file" ]; then
  echo "expand-mkdocs-vars: cannot find $vars_file" >&2
  exit 1
fi

awk -v vars_file="$vars_file" '
BEGIN {
  while ((getline line < vars_file) > 0) {
    if (line ~ /^[A-Za-z0-9_]+:[[:space:]]*[^[:space:]#]/) {
      colon = index(line, ":")
      key = substr(line, 1, colon - 1)
      val = substr(line, colon + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
      if (val ~ /^".*"$/ || val ~ /^'\''.*'\''$/) {
        val = substr(val, 2, length(val) - 2)
      }
      vars[key] = val
    }
  }
  close(vars_file)
}
{
  line = $0
  for (key in vars) {
    pattern = "\\{\\{[[:space:]]*" key "[[:space:]]*\\}\\}"
    gsub(pattern, vars[key], line)
  }

  # Snippets are inserted into pages under docs/. Relative links in those
  # files are written from the docs/ page, not from snippets/.
  if (FILENAME ~ /(^|\/)snippets\//) {
    out = ""
    rest = line
    while (match(rest, /\]\([^)]+\)/)) {
      before = substr(rest, 1, RSTART - 1)
      whole = substr(rest, RSTART, RLENGTH)
      target = substr(whole, 3, length(whole) - 3)
      rest = substr(rest, RSTART + RLENGTH)
      if (target ~ /^[A-Za-z][A-Za-z0-9+.-]*:/ || target ~ /^(\/|#|\.\.|\.\/)/) {
        new = whole
      } else {
        new = "](../docs/" target ")"
      }
      out = out before new
    }
    line = out rest
  }

  print line
}
' "$file"
