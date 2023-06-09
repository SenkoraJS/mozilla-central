.. _mozilla_projects_nss_blank_function:

Function_Name
=============

.. container::

   One-line description of what the function does (more than just what it returns).

`Syntax <#syntax>`__
~~~~~~~~~~~~~~~~~~~~

.. container::

   .. code::

      #include <headers.h>
      ReturnType Function_Name(

          ParamType        ParamName,
          ParamType        ParamName,          );

`Parameters <#parameters>`__
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. container::

   +---------------+---------------------------------------------------------------------------------+
   | ``ParamName`` | Sample: *in* pointer to a `CERTCertDBHandle </en-US/NSS/CERTCertDBHandle>`__    |
   |               | representing the certificate database to look in                                |
   +---------------+---------------------------------------------------------------------------------+
   | ``ParamName`` | Sample: *in* pointer to an `SECItem </en-US/NSS/SECItem>`__ whose ``type`` must |
   |               | be ``siDERCertBuffer`` and whose ``data`` contains a DER-encoded certificate    |
   +---------------+---------------------------------------------------------------------------------+

`Description <#description>`__
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. container::

   Long description of this function, what it does, and why you would use it. Describe all
   side-effects on "out" parameters. Avoid describing the return until the next section, for
   example:

   This function looks in the NSSCryptoContext and the NSSTrustDomain to find the certificate that
   matches the DER-encoded certificate. A match is found when the issuer and serial number of the
   DER-encoded certificate are found on a certificate in the certificate database.

`Returns <#returns>`__
~~~~~~~~~~~~~~~~~~~~~~

.. container::

   Full description of the return value, for example:

   A pointer to a `CERTCertificate </en-US/NSS/CERTCertificate>`__ representing the certificate in
   the database that matched the ``derCert``, or ``NULL`` if none was found. The certificate is a
   shallow copy, use `CERT_DestroyCertificate </en-US/NSS/CERT_DestroyCertificate>`__ to decrement
   the reference count on the certificate instance.

.. _see_also:

`See Also <#see_also>`__
~~~~~~~~~~~~~~~~~~~~~~~~

.. container::

   Copy of the MXR link, with the following text

   Occurrences of ``Function_Name`` in the current NSS source code (generated by MXR).