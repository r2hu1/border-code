#!/bin/sh
set -e

REPO="r2hu1/border-code"
BINARY_NAME="border-code"

OS=$(uname -s)
ARCH=$(uname -m)

case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64) FILE="border-code-macos-arm64" ;;
      x86_64) FILE="border-code-macos-x64" ;;
      *) echo "unsupported arch: $ARCH"; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64) FILE="border-code-linux-x64" ;;
      aarch64) FILE="border-code-linux-arm64" ;;
      *) echo "unsupported arch: $ARCH"; exit 1 ;;
    esac
    ;;
  *) echo "unsupported os: $OS"; exit 1 ;;
esac

TAG=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')

URL="https://github.com/$REPO/releases/download/$TAG/$FILE"

INSTALL_DIR="/usr/local/bin"

echo "downloading $FILE ($TAG)..."
curl -fsSL "$URL" -o "/tmp/$BINARY_NAME"
chmod +x "/tmp/$BINARY_NAME"

if mv "/tmp/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME" 2>/dev/null; then
  echo "installed to $INSTALL_DIR/$BINARY_NAME"
else
  sudo mv "/tmp/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
  echo "installed to $INSTALL_DIR/$BINARY_NAME"
fi

echo "done. run: $BINARY_NAME"
