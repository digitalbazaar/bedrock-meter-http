# bedrock-meter-http ChangeLog

## 8.2.0 - 2022-xx-xx

### Fixed
- Added missing dependencies.

### Changed
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
