#!/usr/bin/env bash
# 把 photos/ 里的原图压成网页用的尺寸，输出到 assets/img/
# 可重复执行；已存在的产物会被覆盖。
set -euo pipefail

cd "$(dirname "$0")/.."
SRC_DIR="photos"
OUT_DIR="assets/img"
mkdir -p "$OUT_DIR"

FULL_PX=1600   # 大图（章节配图、lightbox）
THUMB_PX=700   # 宫格缩略图

shopt -s nullglob nocaseglob
for src in "$SRC_DIR"/*.jpg "$SRC_DIR"/*.jpeg; do
  base="$(basename "${src%.*}")"
  base="$(echo "$base" | tr '[:upper:]' '[:lower:]')"

  sips -Z "$FULL_PX"  -s format jpeg -s formatOptions 70 "$src" --out "$OUT_DIR/${base}.jpg"   >/dev/null
  sips -Z "$THUMB_PX" -s format jpeg -s formatOptions 65 "$src" --out "$OUT_DIR/${base}-t.jpg" >/dev/null
  echo "  $base"
done

# 原图带 GPS/相机 EXIF，页面是公开的，能清就清
if command -v exiftool >/dev/null 2>&1; then
  exiftool -overwrite_original -all= "$OUT_DIR"/*.jpg >/dev/null 2>&1
  echo "EXIF 已清除"
else
  echo "（未装 exiftool，EXIF 保留。要清可跑：brew install exiftool 后重跑本脚本）"
fi

echo
echo "产物总体积：$(du -sh "$OUT_DIR" | cut -f1)"
