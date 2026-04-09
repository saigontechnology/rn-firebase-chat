# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.1] - 2026-03-31

### Added
- Replace loading spinner with animated message skeleton
- Show loading indicator while messages are being fetched and decrypted
- Example app with two-user chat demo
- Enhance personalized info handling in Firestore conversation logic

### Fixed
- Catch Firestore unavailable errors to prevent unhandled rejections
- Handle network errors gracefully and fix emulator Firestore connectivity
- Use correct react-native-worklets peer dep for reanimated v4
- Resolve real-time sync, keyboard, and nested scroll issues
- Encrypt latestMessage text for both text and file messages
- Real-time sync, keyboard, unread count, and latestMessage encryption
- Suppress noisy decryption errors for plain-text legacy messages
- Generate valid hex IV for AES encryption
- Handle configurationEncryption promise rejection in ChatProvider
- Provide non-empty default salt for encryption key generation
- Correct corrupted import path and broken FirestoreProps type
- Enable encrypt by default and maxInputLength issue

### Performance
- Optimize encrypt/decrypt performance
- Defer batch decryption until after UI interactions complete

### Changed
- Decouple storage, lazy-load native deps, use server timestamps
- Update README with Firebase build troubleshooting and configuration details
- Remove outdated and unnecessary example

## [0.6.3] - Previous release
