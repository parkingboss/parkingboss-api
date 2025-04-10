# DEPRECATED: Parking Boss API

This package adds managed access to the parking boss API. The API is relatively
self documented by the types. In general you'll want to use it something like
this:

```ts
import { Api } from "@parkingboss/api";

const api = Api({ client: "my-app" });

if (api.isLoggedIn()) {
  console.log(api);
} else {
  api.logIn();
}
```
