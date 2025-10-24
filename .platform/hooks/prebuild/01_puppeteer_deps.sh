#!/usr/bin/env bash
set -euo pipefail

echo "[puppeteer] installing minimal runtime libs..."

# Keep this list lean. These are the essentials Puppeteer's Chrome needs on AL2023.
dnf -y install --setopt=install_weak_deps=False \
  nss nspr \
  at-spi2-core at-spi2-atk atk \
  cups-filesystem cups-libs \
  libdrm \
  libX11 libX11-xcb libXau libXcomposite libXdamage libXext libXfixes libXi libXrandr libXrender libXtst libXScrnSaver \
  libxcb libxshmfence \
  mesa-libgbm mesa-libglapi mesa-dri-drivers mesa-filesystem \
  pango cairo freetype fontconfig graphite2 fribidi libXft libdatrie libthai \
  libpciaccess pixman libpng libwayland-server \
  alsa-lib \
  liberation-fonts liberation-fonts-common liberation-mono-fonts liberation-sans-fonts liberation-serif-fonts \
  fonts-filesystem xorg-x11-fonts-Type1 google-noto-fonts-common google-noto-sans-vf-fonts langpacks-core-font-en xml-common mkfontscale ttmkfdir \
  xprop \
  libxkbcommon libxkbcommon-x11 xkeyboard-config

# Clean up cached rpms to keep the AMI partition tidy
dnf clean all
rm -rf /var/cache/dnf/*

echo "[puppeteer] minimal libs installed."
