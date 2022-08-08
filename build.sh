#!/bin/bash
# This script is used for building a themed site to preview on render.com
# Preview URL: https://percona-postgresql-operator.onrender.com

#for filename in docs/ReleaseNotes/*.md; do
#  mv "$filename" "$filename.bak"
#  echo "m4_changequote({{,}})" > "$filename"
#  echo "m4_patsubst(" >> "$filename"
#  cat "$filename.bak" >> "$filename"  
#  echo ",{{:jirabug:\`\\(.*?\\)\`}},{{[\\1](https:\\/\\/jira.percona.com/browse\\/\\1)}})" >> "$filename"
#  m4 -P "$filename.bak" > "$filename.m4"
#done

python -m pip install --upgrade pip
pip install wheel

mkdocs build -f ./mkdocs.yml

#for filename in docs/ReleaseNotes/*.md; do
#  mv "$filename.bak" "$filename"
#done
