.. _mozilla_projects_nss_nss_tech_notes_nss_tech_note8:

nss tech note8
==============

.. _background_information_on_libssl's_cache_functions_and_sids:

`Background Information on libSSL's Cache Functions and SIDs <#background_information_on_libssl's_cache_functions_and_sids>`__
------------------------------------------------------------------------------------------------------------------------------

.. container::

.. _nss_technical_note_8:

`NSS Technical Note: 8 <#nss_technical_note_8>`__
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. container::

   .. code::

      27 February 2006
      Nelson B. Bolyard

      Here is some background information on libSSL's cache functions and SIDs.

      A SID (or sslSessionID struct) contains all the info needed to restart
      the ssl session at a later time on another socket.  The protocol code
      builds such a structure, and then asks the cache code (client or server)
      to save the info.  The protocol code can also ask to remove a SID from
      the cache.

      Every SSL socket has two function pointers, ss->sec.cache and ss->sec.uncache,
      which have the following types:
      typedef void (*sslSessionIDCacheFunc)  (sslSessionID *sid);
      typedef void (*sslSessionIDUncacheFunc)(sslSessionID *sid);

      There are two separate implementations of each function, one for clients
      and one for servers.  The client implementation caches or uncaches the
      SID in the client session cache.  The server implementation caches or
      uncaches the SID in the server session cache.

      For servers these pointers point to
             sec->cache   = ssl_sid_cache;
             sec->uncache = ssl_sid_uncache;
      which are functions defined in sslsnce.c, the server session cache source file.

      For clients these pointers point to
             sec->cache   = CacheSID;
             sec->uncache = LockAndUncacheSID;
      which are functions defined in sslnonce.c, the client session cache source file.

      The same cache/uncache API is used by both client and server code.
      As originally designed, before calling the cache function, the caller was
      responsible to fill in the session creation time (which might not be the
      same as the time of insertion into the cache) and the session expiration
      time, among other things.

      Since NSS 1.0, up until NSS 3.4, there were two global variables that
      contained the expected session lifetimes for ssl2 and ssl3 sessions.

      extern PRUint32 ssl_sid_timeout;    (the ssl2 session lifetime)
      extern PRUint32 ssl3_sid_timeout;   (the ssl3 session lifetime)

      Each of these variables applied to both client and server sessions.
      That is, the client session lifetime was NOT separately settable from the
      server session lifetime.

      These two variables were private, declared in a private header file.
      There was no API function by which client programs could set these values.
      However since NSS was delivered as archive libraries, client programs
      merely declared these two variables for themselves, and then were able to
      alter those variables directly.

      For server programs, the function for initializing the server session cache
      would set these two variables according to two of the arguments to that
      function.

      So, SSL protocol code that wanted to cache a SID would do these steps,
      whether for client or for server:

      For ssl2:
          sid->lastAccessTime = sid->creationTime = ssl_Time();
          sid->expirationTime = sid->creationTime + ssl_sid_timeout;
          (*ss->sec.cache)(sid);
      for ssl3:
          sid->lastAccessTime = sid->creationTime = ssl_Time();
          sid->expirationTime = sid->creationTime + ssl3_sid_timeout;
          (*ss->sec.cache)(sid);

      The cache API was defined such that the caller MUST set creationTime
      properly, and may set expirationTime to the desired value or to zero.
      If zero, then the called cache function would compute the correct
      expiration time by adding the chosen timeout (from one of those two
      global variables) to the SID's creationTime, giving the expirationTime.

      However, none of the callers relied on the ability of the respective
      cache functions to be able to compute the expiration time.  All callers
      computed the expiration times explicitly, as shown above.

      The server side of the session cache code was largely rewritten for
      NSS 3.4.  The objectives were to make the server session cache faster,
      and to fix bugs that caused corruption in multi-process servers, and also
      to allow separate virtual servers to have their own session caches.

      The new approach was to use shared memory for the server session cache,
      and to allow multiple different server session caches to coexist.
      As part of that work, I decided that each cache would have its own
      variables containing the SSL2 and SSL3 session durations.
      This means that client cache session lifetimes are separate from server
      session cache lifetimes, and that each server session cache may have its
      own lifetimes.

      So, in NSS 3.4, the global variables ssl3_sid_timeout and ssl_sid_timeout
      were intended to become the definitions for the client cache only, and
      each server cache had its own new pair of variables for ssl2 and ssl3
      session lifetimes, i.e., cache->ssl2Timeout and cache->ssl3Timeout.
      The server cache initialization function was intended to no longer alter
      the variables ssl3_sid_timeout and ssl_sid_timeout, but rather to set the
      server cache's variables.

      Since all the callers of the socket's cache function always initialized
      both their creationTime and expirationTime using the client's session
      lifetime variables, I changed the server's caching function to IGNORE the
      expirationTime computed by the caller, and compute its own expiration
      time, using the cache's own timeout values, or that was the intent.

      But an implementation flaw caused the caching code to continue to use the
      client's timeout time values, not the server cache's own timeout values.
      That is the subject of bug 223242.