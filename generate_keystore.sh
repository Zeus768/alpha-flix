#!/bin/bash
# Generate a keystore for Android signing
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore alphaflix.keystore \
  -alias alphaflix \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass alphaflix123 \
  -keypass alphaflix123 \
  -dname "CN=Alpha Flix, OU=App, O=AlphaFlix, L=City, ST=State, C=US"
