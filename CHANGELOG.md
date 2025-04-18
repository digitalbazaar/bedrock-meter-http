# bedrock-meter-http ChangeLog

## 14.0.0 - 2025-03-07

### Changed
- Update dependencies.
  - `@digitalbazaar/ed25519-multikey@1.3.1`.
- Update peer dependencies.
  - `@bedrock/core@6.3.0`.
  - `@bedrock/did-io@10.4.0`.
  - `@bedrock/jsonld-document-loader@5.2.0`.
  - **BREAKING**: `@bedrock/meter@6`.
     - Updated for `@bedrock/mongodb@11`.
  - **BREAKING**: `@bedrock/zcap-storage@9`.
     - Updated for `@bedrock/mongodb@11`.
- Update dev dependencies.
- Update test dependencies.

## 13.0.0 - 2024-08-02

### Changed
- **BREAKING**: Update peer deps:
  - `@bedrock/core@@6.1.3`
  - `@bedrock/did-io@10.3.1`
  - `@bedrock/express@8.3.1`
  - `@bedrock/jsonld-document-loader@5.1.0`
  - `@bedrock/meter@5.3.0`
  - `@bedrock/zcap-storage@8.0.1`
- Update regular, test, and dev dependencies.

## 12.1.0 - 2024-06-15

### Changed
- Use `@digitalbazaar/ed25519-multikey` to resolve ed25519 verification methods.
  No changes to deployments are expected.

## 12.0.0 - 2023-09-20

### Changed
- Use `@digitalbazaar/ed25519-signature-2020@5`.
- **BREAKING**: Update peer deps:
  - Use `@bedrock/jsonld-document-loader@4`. This version requires Node.js 18+.
- Update test deps.

## 11.0.0 - 2023-08-30

### Changed
- **BREAKING**: Drop support for Nodejs <= 16.
- **BREAKING**: Update peer deps.
  - Update `@bedrock/did-io` peer dep to v10.1.
  - Update `@bedrock/meter` peer dep to v5.2.1.

## 10.1.0 - 2022-11-16

### Changed
- Require `@bedrock/meter@5.1.1` peer dependency.

## 10.0.0 - 2022-11-04

### Changed
- **BREAKING**: Use `@bedrock/meter@5` which uses multihash (identity hash ID)
  when encoding meter IDs to ensure size is encoded / self-describing. No
  existing meters from previous versions will be compatible with this release.

## 9.0.1 - 2022-06-21

### Changed
- Use `package.json` `files` field.

## 9.0.0 - 2022-06-21

### Fixed
- Added missing dependencies.

### Changed
- **BREAKING**: Require Node.js >=16.
- Update dependencies.
  - Fixed test "Service Unavailable" result check.

## 8.1.0 - 2022-05-13

### Added
- Include full error as non-public cause in onError handler.

## 8.0.0 - 2022-04-29

### Changed
- **BREAKING**: Update peer deps:
  - `@bedrock/core@6`
  - `@bedrock/express@8`
  - `@bedrock/jsonld-document-loader@3`
  - `@bedrock/meter@3`
  - `@bedrock/zcap-storage@7`.

## 7.0.0 - 2022-04-05

### Changed
- **BREAKING**: Rename package to `@bedrock/meter-http`.
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Remove default export.
- **BREAKING**: Require node 14.x.

## 6.0.0 - 2022-03-11

### Added
- Add `config.authorizeZcapInvocationOptions` to allow configuration of
  `authorizeZcapInvocation` middleware in `ezcap-express`.

### Changed
- **BREAKING**: Set default TTL for zcaps to 1 year.

## 5.0.0 - 2022-03-01

### Changed
- **BREAKING**: Move zcap revocations to `/zcaps/revocations` to better
  future proof.
- **BREAKING**: Use `@digitalbazaar/ezcap-express@6`.

## 4.0.1 - 2021-01-20

### Fixed
- Do not expose details from errors that are not marked public.

## 4.0.0 - 2021-01-11

### Added
- Add additional tests.

### Changed
- **BREAKING**: Use ezcap-express@5. These changes include major breaking
  simplifications to ZCAP (zcap@7).
- **BREAKING**: Return `201` http response code when creating a meter.

## 3.1.0 - 2021-09-21

### Added
- Implemented update meter config `POST /meters/:meterId`.
- Implemented get meter config `GET /meters/:meterId`.

## 3.0.0 - 2021-09-21

### Changed
- **BREAKING**: A capability invocation via http-sigs is required to create
  meters. Access is controlled via the `config.meterCreationAllowList`
  configuration.

## 2.0.0 - 2021-08-31

### Changed
- **BREAKING**: A meter usage zcap is no longer generated, instead the
  service ID associated with a meter is set as the root controller for the
  meter's usage endpoint. The service can then invoke (or delegate) the root
  zcap for that endpoint. This simplifies setup, and key and zcap management
  by removing the extra unnecessary layer. A `rootController` for the meter
  service itself is no longer needed in its configuration system. This
  simplification is possible because the services associated with any meter
  are already trusted and well known to either the metering system or some
  other system it is integrated with to obtain that information. Since there
  is no perceived benefit to generating an additional zcap that is delegated
  to the service (as opposed to making the service the root controller for
  meter usage), this extra plumbing has been removed.

### Removed
- Removed `usage` from the config system, these configuration options are
  no longer used.

## 1.1.0 - 2021-07-23

### Changed
- Update peer dependencies.

## 1.0.0 - 2021-07-22

- See git history for changes.
