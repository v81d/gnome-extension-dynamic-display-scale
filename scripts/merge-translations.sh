for pofile in po/*.po; do
  msgmerge --update "$pofile" po/dynamic-display-scale.pot
done
