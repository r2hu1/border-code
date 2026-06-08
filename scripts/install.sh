#!/bin/sh
set -e

REPO="r2hu1/border-code"
BINARY_NAME="border-code"

OS=$(uname -s)
ARCH=$(uname -m)

case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64) FILE="border-code-macos" ;;
      x86_64) FILE="border-code-macos-x64" ;;
      *) echo "unsupported arch: $ARCH"; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64) FILE="border-code-linux" ;;
      aarch64) FILE="border-code-linux-arm" ;;
      *) echo "unsupported arch: $ARCH"; exit 1 ;;
    esac
    ;;
  *) echo "unsupported os: $OS"; exit 1 ;;
esac

TAG=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')

URL="https://github.com/$REPO/releases/download/$TAG/$FILE"

INSTALL_DIR="/usr/local/bin"
# Ensure the install directory exists
mkdir -p "$INSTALL_DIR"

echo "downloading $FILE ($TAG)..."
curl -fsSL "$URL" -o "/tmp/$BINARY_NAME"
chmod +x "/tmp/$BINARY_NAME"

# Move the binary into the install directory (use sudo if needed)
if mv "/tmp/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME" 2>/dev/null; then
  echo "installed to $INSTALL_DIR/$BINARY_NAME"
else
  sudo mv "/tmp/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
  echo "installed to $INSTALL_DIR/$BINARY_NAME"
fi

echo "done. run: $BINARY_NAME"
