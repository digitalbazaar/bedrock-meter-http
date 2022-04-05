# bedrock-meter-http ChangeLog

## 7.0.0 - 2022-04-xx

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
