# Mazeltov access module

This is the primary access control module that adds support for

* JWT based authentication
* Roles
* Permissions
* The `gate` helper in html based views

## How it Works

When you install this module using `mazeltov install @mazeltov/access`, it creates
a public/private rsa key pair (in ./rsa by default).

The main authorization scheme is based on Oauth2 so client, password and auth code flow are supported. When you sign in with the form, signed, https only cookies are used to transport the JWT which uses standard claims (jti, exp, sub, aud etc.)

Then these middleware are used to check that the requests is authenticated and authorized

#### requireAuth

Used for API endpoints. checks that the Authorization header has this content `Bearer <JWT access token>`. The JWT is verified, decoded, and the `subject` is fetched from DB and passed through request. If the JWT contains a scope of 'person', the subject is a person and if the scope contains 'client', it is a client (such as a remote script).

#### requireSessionAuth

Used for web endpoints. Sees if there is a signed user in session and passes this off as the `subject` of the request. Works like requireAuth, but uses the connect session id instead.

#### canAccess

Permissions are gathered based on the subjects roles and checked using the `checkMethod`. This is usually the method of a model built as a subjectAuthorizer, but can be any function.

Here is how scopes (outside of person and client scopes) work:
  - each scope has many permissions
  - when a scope is on the JWT, the intersection of the subjects permissions and the scope are examined.

#### jwtToSession

This is registered to all web routes by default and will instantiate a session for a user if the signed JWT is available in the cookie. This is skipped if the session is already open.

## Settings

These are the defaults that can be overwritten in your DB, or .env file

MAZELTOV\_ACCESS\_PRIVATE\_KEY\_PATH=rsa/key.pem
MAZELTOV\_ACCESS\_PUBLIC\_KEY\_PATH=rsa/pub.pem
MAZELTOV\_ACCESS\_SELF\_CLIENT\_ID=(32 random hex bytes)
MAZELTOV\_ACCESS\_SELF\_CLIENT\_SECRET=(32 random hex bytes)
MAZELTOV\_ACCESS\_SELF\_CLIENT\_REDIRECT\_URLS={app.proto}://{app.host}/account

## Scoped vs Unscoped permissions

Permissions follow these semantics:

When unscoped: `can {action} {resource}`
When scoped: `can {action} {any|own} {resource}`

Where action and resource are expected to be in camelCase. A scoped permission checks ownership of that resource.

Scoped permissions can be very complicated, but are necessary to determine ownership of a resource (rather than if a subject can use a resource in general)

**Example 1**

A person has a role with `can get own profile`

Your profileModel has this action defined

```js
[
  ['subjectAuthorizer', {
    fnName: 'canGet',
    ownershipColumn: 'ownerId',
    // false by default
    scoped: true,
  }],
]
```

## Known Limitations

The `gate` helper in views can only check permission as-is without scope checking, so you will want to use the most restrictive permissions with `gate`, or use custom checks where necessary. example:

A user has `can get own profile`

if you simply add `gate(['can get own profile'])` To your template, this will not check that the person in fact owns the resource, but that they have this permission. The scope is checked however if he permission is required to access the page, or an api endpoint but simply doesn't work in regards to conditionally rendering links/menus in the same way.

This is unfortunately due to a limitation of pug being single threaded and having no support for async/await so it would completely ruin performance if many resources are checked.

Work arounds:
  * Use the most restrictive permissions
  * Do the checks from a model or service and pass into view.
