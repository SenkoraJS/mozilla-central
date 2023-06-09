.. _mozilla_projects_nss_nss_sample_code_enc_dec_mac_output_plblic_key_as_csr:

Enc Dec MAC Output Public Key as CSR
====================================

.. _nss_sample_code_5_encryptiondecryption_and_mac_and_output_public_as_a_csr.:

`NSS Sample Code 5: Encryption/Decryption and MAC and output Public as a CSR. <#nss_sample_code_5_encryptiondecryption_and_mac_and_output_public_as_a_csr.>`__
--------------------------------------------------------------------------------------------------------------------------------------------------------------

.. container::

   Generates encryption/mac keys and outputs public key as certificate signing request

   .. code:: c

      /* This Source Code Form is subject to the terms of the Mozilla Public
       * License, v. 2.0. If a copy of the MPL was not distributed with this
       * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

      /* NSPR Headers */
      #include
      #include
      #include
      #include
      #include
      #include
      #include

      /* NSS headers */
      #include
      #include
      #include
      #include
      #include
      #include
      #include
      #include
      #include
      #include
      #include
      #include

      /* our samples utilities */
      #include "util.h"

      #define BUFFERSIZE            80
      #define DIGESTSIZE            16
      #define PTEXT_MAC_BUFFER_SIZE 96
      #define CIPHERSIZE            96
      #define BLOCKSIZE             32
      #define DEFAULT_KEY_BITS      1024


      #define CIPHER_HEADER         "-----BEGIN CIPHER-----"
      #define CIPHER_TRAILER        "-----END CIPHER-----"
      #define ENCKEY_HEADER         "-----BEGIN WRAPPED ENCKEY-----"
      #define ENCKEY_TRAILER        "-----END WRAPPED ENCKEY-----"
      #define MACKEY_HEADER         "-----BEGIN WRAPPED MACKEY-----"
      #define MACKEY_TRAILER        "-----END WRAPPED MACKEY-----"
      #define IV_HEADER             "-----BEGIN IV-----"
      #define IV_TRAILER            "-----END IV-----"
      #define MAC_HEADER            "-----BEGIN MAC-----"
      #define MAC_TRAILER           "-----END MAC-----"
      #define PAD_HEADER            "-----BEGIN PAD-----"
      #define PAD_TRAILER           "-----END PAD-----"
      #define LAB_HEADER            "-----BEGIN KEY LABEL-----"
      #define LAB_TRAILER           "-----END KEY LABEL-----"
      #define PUBKEY_HEADER         "-----BEGIN PUB KEY -----"
      #define PUBKEY_TRAILER        "-----END PUB KEY -----"
      #define NS_CERTREQ_HEADER     "-----BEGIN NEW CERTIFICATE REQUEST-----"
      #define NS_CERTREQ_TRAILER    "-----END NEW CERTIFICATE REQUEST-----"


      typedef enum {
          GEN_CSR,
          ENCRYPT,
          DECRYPT,
          UNKNOWN
      } CommandType;

      typedef enum {
         SYMKEY = 0,
         MACKEY = 1,
         IV     = 2,
         MAC    = 3,
         PAD    = 4,
         PUBKEY = 5,
         LAB    = 6
      } HeaderType;

      /* This is conditionalized because PORT_ErrorToString was introduced with nss 3.13.
       * Though PR_ErrorToString was available, support for it in nss wasn't.
       * FIXME: samples should determine the version of nss that's available and refuse
       * to run if not 3.13 or higher.
       */
      #ifndef PORT_ErrorToString
      #ifndef SEC_ERROR_BASE
      #define SEC_ERROR_BASE                          (-0x2000)
      #define PORT_ErrorToString(err) PR_ErrorToString((err), PR_LANGUAGE_I_DEFAULT)
      #endif
      #endif


      /*
       * Print usage message and exit
       */
      static void
      Usage(const char *progName)
      {
          fprintf(stderr, "\nUsage:  %s -c  -d  [-z ] "
                  "[-p  | -f ] -s  -r  -i  -o  \n\n",
                  progName);
          fprintf(stderr, "%-20s  Specify 'G' for generating RSA keypair for wrapping\n\n",
                   "G");
          fprintf(stderr, "%-20s  Specify 'E' for encrypt operation\n\n",
                   "E");
          fprintf(stderr, "%-20s  Specify 'D' for decrypt operation\n\n",
                   "D");
          fprintf(stderr, "%-20s  Specify db directory path\n\n",
                   "-d ");
          fprintf(stderr, "%-20s  Specify db password [optional]\n\n",
                   "-p ");
          fprintf(stderr, "%-20s  Specify db password file [optional]\n\n",
                   "-f ");
          fprintf(stderr, "%-20s  Specify noise file name [optional]\n\n",
                   "-z ");
          fprintf(stderr, "%-21s Specify subject\n\n",
                   "-s ");
          fprintf(stderr, "%-21s Specify certficate request file name\n\n",
                   "-r ");
          fprintf(stderr, "%-21s Specify an input file name\n\n",
                   "-i ");
          fprintf(stderr, "%-21s Specify an output file name\n\n",
                   "-o ");
          fprintf(stderr, "%-7s For encrypt, it takes  as an input file and produces\n",
                   "Note :");
          fprintf(stderr, "%-7s .enc and .header as intermediate output files.\n\n",
                   "");
          fprintf(stderr, "%-7s For decrypt, it takes .enc and .header\n",
                   "");
          fprintf(stderr, "%-7s as input files and produces  as a final output file.\n\n",
                   "");
          exit(-1);
      }


      /* Map option letter enumerated commad type */
      static CommandType option2Command(const char* c)
      {
          switch (*c) {
          case 'G': return GEN_CSR;
          case 'E': return ENCRYPT;
          case 'D': return DECRYPT;
          default:  return UNKNOWN;
          }
      }

      /*
       * Wrap the symkey using public key
       */
      SECStatus
      WrapKey(PK11SymKey* key, SECKEYPublicKey *pubKey, SECItem **wrappedKey)
      {
          SECStatus rv;
          SECItem *data = (SECItem *)PORT_ZAlloc(sizeof(SECItem));

          if (!data) {
              PR_fprintf(PR_STDERR, "Error while allocating memory\n");
              rv = SECFailure;
              goto cleanup;
          }

          data->len = SECKEY_PublicKeyStrength(pubKey);
          data->data = (unsigned char*)PORT_ZAlloc((data->len)*sizeof(unsigned int));

          if (!data->data) {
              PR_fprintf(PR_STDERR, "Error while allocating memory\n");
              rv = SECFailure;
              goto cleanup;
          }

          rv = PK11_PubWrapSymKey(CKM_RSA_PKCS, pubKey, key, data);
          if (rv != SECSuccess) {
              rv = SECFailure;
          } else {
              *wrappedKey = data;
              return SECSuccess;
          }

      cleanup:
          if (data) {
              SECITEM_FreeItem(data, PR_TRUE);
          }
          return rv;
      }

      /*
       * Generate a Symmetric Key
       */
      PK11SymKey *
      GenerateSYMKey(PK11SlotInfo  *slot, CK_MECHANISM_TYPE mechanism,
                     int keySize, SECItem *keyID, secuPWData *pwdata)
      {
          SECStatus      rv;
          PK11SymKey    *key;

          /* Generate the symmetric key */
          key = PK11_TokenKeyGen(slot, mechanism,
                  NULL, keySize, keyID, PR_FALSE, pwdata);

          if (!key) {
              PR_fprintf(PR_STDERR, "Symmetric Key Generation Failed \n");
          }

          return key;
      }

      /*
       * MacInit
       */
      SECStatus
      MacInit(PK11Context *ctx)
      {
          SECStatus rv = PK11_DigestBegin(ctx);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Compute MAC Failed : PK11_DigestBegin()\n");
          }
          return rv;
      }

      /*
       * MacUpdate
       */
      SECStatus
      MacUpdate(PK11Context *ctx,
                unsigned char *msg, unsigned int msgLen)
      {
          SECStatus rv = PK11_DigestOp(ctx, msg, msgLen);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Compute MAC Failed : DigestOp()\n");
          }
          return rv;
      }

      /*
       * Finalize MACing
       */
      SECStatus
      MacFinal(PK11Context *ctx,
               unsigned char *mac, unsigned int *macLen, unsigned int maxLen)
      {
          SECStatus rv = PK11_DigestFinal(ctx, mac, macLen, maxLen);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Compute MAC Failed : PK11_DigestFinal()\n");
          }
          return SECSuccess;
      }

      /*
       * Compute Mac
       */
      SECStatus
      ComputeMac(PK11Context *ctxmac,
                 unsigned char *ptext, unsigned int ptextLen,
                 unsigned char *mac, unsigned int *macLen,
                 unsigned int maxLen)
      {
          SECStatus rv = MacInit(ctxmac);
          if (rv != SECSuccess) return rv;
          rv = MacUpdate(ctxmac, ptext, ptextLen);
          if (rv != SECSuccess) return rv;
          rv = MacFinal(ctxmac, mac, macLen, maxLen);
          return rv;
      }

      /*
       * WriteToHeaderFile
       */
      SECStatus
      WriteToHeaderFile(const char *buf, unsigned int len, HeaderType type,
                        PRFileDesc *outFile)
      {
          SECStatus      rv;
          const char    *header;
          const char    *trailer;

          switch (type) {
          case SYMKEY:
              header = ENCKEY_HEADER;
              trailer = ENCKEY_TRAILER;
              break;
          case MACKEY:
              header =  MACKEY_HEADER;
              trailer = MACKEY_TRAILER;
              break;
          case IV:
              header = IV_HEADER;
              trailer = IV_TRAILER;
              break;
          case MAC:
              header = MAC_HEADER;
              trailer = MAC_TRAILER;
              break;
          case PAD:
              header = PAD_HEADER;
              trailer = PAD_TRAILER;
              break;
          case PUBKEY:
              header = PUBKEY_HEADER;
              trailer = PUBKEY_TRAILER;
              break;
          case LAB:
              header = LAB_HEADER;
              trailer = LAB_TRAILER;
              PR_fprintf(outFile, "%s\n", header);
              PR_fprintf(outFile, "%s\n", buf);
              PR_fprintf(outFile, "%s\n\n", trailer);
              return SECSuccess;
              break;
              default:
              return SECFailure;
          }

          PR_fprintf(outFile, "%s\n", header);
          PrintAsAscii(outFile, buf, len);
          PR_fprintf(outFile, "%s\n\n", trailer);
          return SECSuccess;
      }

      /*
       * Initialize for encryption or decryption - common code
       */
      PK11Context *
      CryptInit(PK11SymKey *key,
                unsigned char *iv, unsigned int ivLen,
                CK_MECHANISM_TYPE type, CK_ATTRIBUTE_TYPE operation)
      {
          SECItem ivItem = { siBuffer, iv, ivLen };
          PK11Context *ctx = NULL;

          SECItem *secParam = PK11_ParamFromIV(type, &ivItem);
          if (secParam == NULL) {
              PR_fprintf(PR_STDERR, "Crypt Failed : secParam NULL\n");
              return NULL;
          }
          ctx = PK11_CreateContextBySymKey(type, operation, key, secParam);
          if (ctx == NULL) {
              PR_fprintf(PR_STDERR, "Crypt Failed : can't create a context\n");
              goto cleanup;

          }
      cleanup:
          if (secParam) {
              SECITEM_FreeItem(secParam, PR_TRUE);
          }
          return ctx;
      }

      /*
       * Common encryption and decryption code
       */
      SECStatus
      Crypt(PK11Context *ctx,
            unsigned char *out, unsigned int *outLen, unsigned int maxOut,
            unsigned char *in, unsigned int inLen)
      {
          SECStatus rv;

          rv = PK11_CipherOp(ctx, out, outLen, maxOut, in, inLen);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Crypt Failed : PK11_CipherOp returned %d\n", rv);
              goto cleanup;
          }

      cleanup:
          if (rv != SECSuccess) {
              return rv;
          }
          return SECSuccess;
      }

      /*
       * Decrypt
       */
      SECStatus
      Decrypt(PK11Context *ctx,
              unsigned char *out, unsigned int *outLen, unsigned int maxout,
              unsigned char *in, unsigned int inLen)
      {
          return Crypt(ctx, out, outLen, maxout, in, inLen);
      }

      /*
       * Encrypt
       */
      SECStatus
      Encrypt(PK11Context* ctx,
              unsigned char *out, unsigned int *outLen, unsigned int maxout,
              unsigned char *in, unsigned int inLen)
      {
          return Crypt(ctx, out, outLen, maxout, in, inLen);
      }

      /*
       * EncryptInit
       */
      PK11Context *
      EncryptInit(PK11SymKey *ek, unsigned char *iv, unsigned int ivLen,
                  CK_MECHANISM_TYPE type)
      {
          return CryptInit(ek, iv, ivLen, type, CKA_ENCRYPT);
      }

      /*
       * DecryptInit
       */
      PK11Context *
      DecryptInit(PK11SymKey *dk, unsigned char *iv, unsigned int ivLen,
                  CK_MECHANISM_TYPE type)
      {
          return CryptInit(dk, iv, ivLen, type, CKA_DECRYPT);
      }

      /*
       * Read cryptographic parameters from the header file
       */
      SECStatus
      ReadFromHeaderFile(const char *fileName, HeaderType type,
                         SECItem *item, PRBool isHexData)
      {
          SECStatus      rv;
          SECItem        filedata;
          SECItem        outbuf;
          unsigned char *nonbody;
          unsigned char *body;
          char          *header;
          char          *trailer;
          PRFileDesc    *file = NULL;

          outbuf.type = siBuffer;
          file = PR_Open(fileName, PR_RDONLY, 0);
          if (!file) {
              PR_fprintf(PR_STDERR, "Failed to open %s\n", fileName);
              return SECFailure;
          }
          switch (type) {
          case PUBKEY:
              header = PUBKEY_HEADER;
              trailer = PUBKEY_TRAILER;
              break;
          case SYMKEY:
              header = ENCKEY_HEADER;
              trailer = ENCKEY_TRAILER;
              break;
          case MACKEY:
              header = MACKEY_HEADER;
              trailer = MACKEY_TRAILER;
              break;
          case IV:
              header = IV_HEADER;
              trailer = IV_TRAILER;
              break;
          case MAC:
              header = MAC_HEADER;
              trailer = MAC_TRAILER;
              break;
          case PAD:
              header = PAD_HEADER;
              trailer = PAD_TRAILER;
              break;
          case LAB:
              header = LAB_HEADER;
              trailer = LAB_TRAILER;
              break;
          default:
              PR_Close(file);
              return SECFailure;
          }

          rv = FileToItem(&filedata, file);
          nonbody = (char *)filedata.data;
          if (!nonbody) {
              PR_fprintf(PR_STDERR, "unable to read data from input file\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* check for headers and trailers and remove them */
          char *trail = NULL;
          if ((body = strstr(nonbody, header)) != NULL) {
              char *trail = NULL;
              nonbody = body;
              body = PORT_Strchr(body, '\n');
              if (!body)
                  body = PORT_Strchr(nonbody, '\r'); /* maybe this is a MAC file */
              if (body)
                  trail = strstr(++body, trailer);
              if (trail != NULL) {
                  *trail = '\0';
              } else {
                  PR_fprintf(PR_STDERR,  "input has header but no trailer\n");
                  PORT_Free(filedata.data);
                  return SECFailure;
              }
          } else {
              /* headers didn't exist */
              body = nonbody;
              if (body) {
                  trail = strstr(++body, trailer);
                  if (trail != NULL) {
                      PR_fprintf(PR_STDERR,
                          "input has no header but has trailer\n");
                      PORT_Free(filedata.data);
                      return SECFailure;
                  }
              }
          }

      cleanup:
          PR_Close(file);
          ATOB_ConvertAsciiToItem(item, body);
          return SECSuccess;
      }

      /*
       * Generate the private key
       */
      SECKEYPrivateKey *
      GeneratePrivateKey(KeyType keytype, PK11SlotInfo *slot, int size,
                         int publicExponent, const char *noiseFileName,
                         SECKEYPublicKey **pubkeyp, const char *pqgFile,
                         secuPWData *pwdata)
      {
          CK_MECHANISM_TYPE  mechanism;
          SECOidTag          algtag;
          PK11RSAGenParams   rsaparams;
          void              *params;
          SECKEYPrivateKey  *privKey    = NULL;
          SECStatus          rv;
          unsigned char      randbuf[BLOCKSIZE + 1];

          rv = GenerateRandom(randbuf, BLOCKSIZE);
          if (rv != SECSuccess) {
              fprintf(stderr, "Error while generating the random numbers : %s\n",
                      PORT_ErrorToString(rv));
              goto cleanup;
          }
          PK11_RandomUpdate(randbuf, BLOCKSIZE);
          switch (keytype) {
              case rsaKey:
                  rsaparams.keySizeInBits = size;
                  rsaparams.pe            = publicExponent;
                  mechanism               = CKM_RSA_PKCS_KEY_PAIR_GEN;
                  algtag                  = SEC_OID_PKCS1_MD5_WITH_RSA_ENCRYPTION;
                  params                  = &rsaparams;
                  break;
              default:
                  goto cleanup;
          }
          fprintf(stderr, "\n\n");
          fprintf(stderr, "Generating key.  This may take a few moments...\n\n");
          privKey = PK11_GenerateKeyPair(slot, mechanism, params, pubkeyp,
                                             PR_TRUE /*isPerm*/, PR_TRUE /*isSensitive*/,
                                             pwdata);
      cleanup:
          return privKey;
      }

      /*
       * Extract the public key request from CSR
       */
      SECKEYPublicKey *
      ExtractPublicKeyFromCertRequest(const char *inFileName, PRBool ascii)
      {
          CERTSignedData signedData;
          SECItem reqDER;
          CERTCertificateRequest *certReq = NULL;
          SECStatus rv                    = SECSuccess;
          PRArenaPool *arena              = NULL;
          SECKEYPublicKey *publicKey      = NULL;

          arena = PORT_NewArena(DER_DEFAULT_CHUNKSIZE);
          if (arena == NULL) {
              rv = SECFailure;
              goto cleanup;
          }

          rv = ReadDERFromFile(&reqDER, inFileName, ascii);
          if (rv) {
              rv = SECFailure;
              goto cleanup;
          }
          certReq = (CERTCertificateRequest*) PORT_ArenaZAlloc
                     (arena, sizeof(CERTCertificateRequest));
          if (!certReq) {
              rv = SECFailure;
              goto cleanup;
          }
          certReq->arena = arena;

          /* Since cert request is a signed data, must decode to get the inner
             data
          */
          PORT_Memset(&signedData, 0, sizeof(signedData));
          rv = SEC_ASN1DecodeItem(arena, &signedData,
                                  SEC_ASN1_GET(CERT_SignedDataTemplate), &reqDER);
          if (rv) {
              rv = SECFailure;
              goto cleanup;
          }
          rv = SEC_ASN1DecodeItem(arena, certReq,
                                  SEC_ASN1_GET(CERT_CertificateRequestTemplate), &signedData.data);
          if (rv) {
              rv = SECFailure;
              goto cleanup;
          }
          rv = CERT_VerifySignedDataWithPublicKeyInfo(&signedData,
                      &certReq->subjectPublicKeyInfo, NULL /* wincx */);
          publicKey = SECKEY_ExtractPublicKey(&certReq->subjectPublicKeyInfo);

      cleanup:
          if (reqDER.data) {
              SECITEM_FreeItem(&reqDER, PR_FALSE);
          }
          if (arena) {
              PORT_FreeArena(arena, PR_FALSE);
          }
          return publicKey;
      }

      /*
       * Get the private key corresponding to public key
       */
      SECKEYPrivateKey *
      GetRSAPrivateKey(PK11SlotInfo    *slot,
                      secuPWData       *pwdata,
                      SECKEYPublicKey  *pubKey)
      {
          SECKEYPrivateKey         *privKey   = NULL;
          SECItem                  *cka_id;

          if (slot == NULL) {
              fprintf(stderr, "Empty Slot\n");
              goto cleanup;
          }
          if (PK11_Authenticate(slot, PR_TRUE, pwdata) != SECSuccess) {
              fprintf(stderr, "could not authenticate to token %s.",
                      PK11_GetTokenName(slot));
              goto cleanup;
          }
          cka_id  = &pubKey->u.rsa.modulus;
          cka_id  = PK11_MakeIDFromPubKey(cka_id);
          privKey = PK11_FindKeyByKeyID(slot, cka_id, pwdata);
      cleanup:
          return privKey;
      }

      /*
       *  Generate the certificate request with subject
       */
      static SECStatus
      CertReq(SECKEYPrivateKey *privk, SECKEYPublicKey *pubk, KeyType keyType,
              SECOidTag hashAlgTag, CERTName *subject, PRBool ascii,
              const char *certReqFileName)
      {
          CERTSubjectPublicKeyInfo *spki          = NULL;
          CERTCertificateRequest   *cr            = NULL;
          SECItem                  *encoding      = NULL;
          SECOidTag                 signAlgTag;
          SECItem                   result;
          SECStatus                 rv            = SECSuccess;
          PRInt32                   numBytes;
          void                     *extHandle;
          PRArenaPool              *arena         = NULL;
          PRFileDesc               *outFile       = NULL;

          /*  Open the certificate request file to write */
          outFile = PR_Open(certReqFileName, PR_CREATE_FILE | PR_RDWR | PR_TRUNCATE, 00660);
          if (!outFile) {
              PR_fprintf(PR_STDERR,
                         "unable to open \"%s\" for writing (%ld, %ld).\n",
                         certReqFileName, PR_GetError(), PR_GetOSError());
              goto cleanup;
          }
          /* Create info about public key */
          spki = SECKEY_CreateSubjectPublicKeyInfo(pubk);
          if (!spki) {
              PR_fprintf(PR_STDERR, "unable to create subject public key\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* Generate certificate request */
          cr = CERT_CreateCertificateRequest(subject, spki, NULL);
          if (!cr) {
              PR_fprintf(PR_STDERR, "unable to make certificate request\n");
              rv = SECFailure;
              goto cleanup;
          }

          arena = PORT_NewArena(DER_DEFAULT_CHUNKSIZE);
          if (!arena) {
              fprintf(stderr, "out of memory");
              rv = SECFailure;
              goto cleanup;
          }

          extHandle = CERT_StartCertificateRequestAttributes(cr);
          if (extHandle == NULL) {
              PORT_FreeArena (arena, PR_FALSE);
              rv = SECFailure;
              goto cleanup;
          }

          CERT_FinishExtensions(extHandle);
          CERT_FinishCertificateRequestAttributes(cr);

          /* Der encode the request */
          encoding = SEC_ASN1EncodeItem(arena, NULL, cr,
                                        SEC_ASN1_GET(CERT_CertificateRequestTemplate));
          if (encoding == NULL) {
              PR_fprintf(PR_STDERR, "der encoding of request failed\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* Sign the request */
          signAlgTag = SEC_GetSignatureAlgorithmOidTag(keyType, hashAlgTag);
          if (signAlgTag == SEC_OID_UNKNOWN) {
              PR_fprintf(PR_STDERR, "unknown Key or Hash type\n");
              rv = SECFailure;
              goto cleanup;
          }
          rv = SEC_DerSignData(arena, &result, encoding->data, encoding->len,
                               privk, signAlgTag);
          if (rv) {
              PR_fprintf(PR_STDERR, "signing of data failed\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* Encode request in specified format */
          if (ascii) {
              char *obuf;
              char *name, *email, *org, *state, *country;
              SECItem *it;
              int total;

              it = &result;

              obuf = BTOA_ConvertItemToAscii(it);
              total = PL_strlen(obuf);

              name = CERT_GetCommonName(subject);
              if (!name) {
                  name = strdup("(not specified)");
              }

              email = CERT_GetCertEmailAddress(subject);
              if (!email)
                  email = strdup("(not specified)");

              org = CERT_GetOrgName(subject);
              if (!org)
                  org = strdup("(not specified)");

              state = CERT_GetStateName(subject);
              if (!state)
                  state = strdup("(not specified)");

              country = CERT_GetCountryName(subject);
              if (!country)
                  country = strdup("(not specified)");

              PR_fprintf(outFile,
                         "\nCertificate request generated by Netscape certutil\n");
              PR_fprintf(outFile, "Common Name: %s\n", name);
              PR_fprintf(outFile, "Email: %s\n", email);
              PR_fprintf(outFile, "Organization: %s\n", org);
              PR_fprintf(outFile, "State: %s\n", state);
              PR_fprintf(outFile, "Country: %s\n\n", country);

              PR_fprintf(outFile, "%s\n", NS_CERTREQ_HEADER);
              numBytes = PR_Write(outFile, obuf, total);
              if (numBytes != total) {
                  PR_fprintf(PR_STDERR, "write error\n");
                  return SECFailure;
              }
              PR_fprintf(outFile, "\n%s\n", NS_CERTREQ_TRAILER);
              if (obuf) {
                  PORT_Free(obuf);
              }
          } else {
              numBytes = PR_Write(outFile, result.data, result.len);
              if (numBytes != (int)result.len) {
                  PR_fprintf(PR_STDERR, "write error\n");
                  rv = SECFailure;
              goto cleanup;
              }
          }
      cleanup:
          if (spki) {
              SECKEY_DestroySubjectPublicKeyInfo(spki);
          }
          if (cr) {
              CERT_DestroyCertificateRequest (cr);
          }
          if (arena) {
              PORT_FreeArena(arena, PR_FALSE);
          }
          if (outFile) {
              PR_Close(outFile);
          }
          return rv;
      }

      /*
       * Mac and Encrypt the input file content
       */
      SECStatus
      EncryptAndMac(PRFileDesc *inFile,
                    PRFileDesc *headerFile,
                    PRFileDesc *encFile,
                    PK11SymKey *ek,
                    PK11SymKey *mk,
                    unsigned char *iv, unsigned int ivLen,
                    PRBool ascii)
      {
          SECStatus      rv;
          unsigned char  ptext[BLOCKSIZE];
          unsigned int   ptextLen;
          unsigned char  mac[DIGESTSIZE];
          unsigned int   macLen;
          unsigned int   nwritten;
          unsigned char  encbuf[BLOCKSIZE];
          unsigned int   encbufLen;
          SECItem        noParams = { siBuffer, NULL, 0 };
          PK11Context   *ctxmac = NULL;
          PK11Context   *ctxenc = NULL;
          unsigned int   pad[1];
          SECItem        padItem;
          unsigned int   paddingLength = 0;

          static unsigned int firstTime = 1;
          int j;

          ctxmac = PK11_CreateContextBySymKey(CKM_MD5_HMAC, CKA_SIGN, mk, &noParams);
          if (ctxmac == NULL) {
              PR_fprintf(PR_STDERR, "Can't create MAC context\n");
              rv = SECFailure;
              goto cleanup;
          }
          rv = MacInit(ctxmac);
          if (rv != SECSuccess) {
              goto cleanup;
          }

          ctxenc = EncryptInit(ek, iv, ivLen, CKM_AES_CBC);

          /* read a buffer of plaintext from input file */
          while ((ptextLen = PR_Read(inFile, ptext, sizeof(ptext))) > 0) {
              /* Encrypt using it using CBC, using previously created IV */
              if (ptextLen != BLOCKSIZE) {
                  paddingLength = BLOCKSIZE - ptextLen;
                  for ( j=0; j < paddingLength; j++) {
                      ptext[ptextLen+j] = (unsigned char)paddingLength;
                  }
                  ptextLen = BLOCKSIZE;
              }
              rv  = Encrypt(ctxenc,
                      encbuf, &encbufLen, sizeof(encbuf),
                      ptext, ptextLen);
              if (rv != SECSuccess) {
                  PR_fprintf(PR_STDERR, "Encrypt Failure\n");
                  goto cleanup;
              }

              /* save the last block of ciphertext as the next IV */
              iv = encbuf;
              ivLen = encbufLen;

              /* write the cipher text to intermediate file */
              nwritten = PR_Write(encFile, encbuf, encbufLen);
              /*PR_Assert(nwritten == encbufLen);*/

              rv = MacUpdate(ctxmac, ptext, ptextLen);
              if (rv != SECSuccess)
                  goto cleanup;
          }

          rv = MacFinal(ctxmac, mac, &macLen, DIGESTSIZE);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "MacFinal Failure\n");
              goto cleanup;
          }
          if (macLen == 0) {
              PR_fprintf(PR_STDERR, "Bad MAC length\n");
              rv = SECFailure;
              goto cleanup;
          }
          WriteToHeaderFile(mac, macLen, MAC, headerFile);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Write MAC Failure\n");
              goto cleanup;
          }

          pad[0] = paddingLength;
          padItem.type = siBuffer;
          padItem.data = (unsigned char *)pad;
          padItem.len  = sizeof(pad[0]);

          WriteToHeaderFile(padItem.data, padItem.len, PAD, headerFile);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Write PAD Failure\n");
              goto cleanup;
          }

          rv = SECSuccess;

      cleanup:
          if (ctxmac != NULL) {
              PK11_DestroyContext(ctxmac, PR_TRUE);
          }
          if (ctxenc != NULL) {
              PK11_DestroyContext(ctxenc, PR_TRUE);
          }

          return rv;
      }

      /*
       * Decrypt and Verify MAC
       */
      SECStatus
      DecryptAndVerifyMac(PRFileDesc *outFile,
          PRFileDesc *inFile, unsigned int inFileLength,
          SECItem *cItem, SECItem *macItem,
          PK11SymKey* ek, PK11SymKey* mk, SECItem *ivItem, SECItem *padItem)
      {
          SECStatus      rv;
          unsigned char  decbuf[64];
          unsigned int   decbufLen;

          unsigned char  ptext[BLOCKSIZE];
          unsigned int   ptextLen = 0;
          unsigned char  ctext[64];
          unsigned int   ctextLen;
          unsigned char  newmac[DIGESTSIZE];
          unsigned int   newmacLen                 = 0;
          unsigned int   newptextLen               = 0;
          unsigned int   count                     = 0;
          unsigned int   temp                      = 0;
          unsigned int   blockNumber               = 0;
          SECItem        noParams = { siBuffer, NULL, 0 };
          PK11Context   *ctxmac = NULL;
          PK11Context   *ctxenc = NULL;

          unsigned char iv[BLOCKSIZE];
          unsigned int ivLen = ivItem->len;
          unsigned int paddingLength;
          int j;

          memcpy(iv, ivItem->data, ivItem->len);
          paddingLength = (unsigned int)padItem->data[0];

          ctxmac = PK11_CreateContextBySymKey(CKM_MD5_HMAC, CKA_SIGN, mk, &noParams);
          if (ctxmac == NULL) {
              PR_fprintf(PR_STDERR, "Can't create MAC context\n");
              rv = SECFailure;
              goto cleanup;
          }

          rv = MacInit(ctxmac);
          if (rv != SECSuccess) goto cleanup;

          ctxenc = DecryptInit(ek, iv, ivLen, CKM_AES_CBC);

          while ((ctextLen = PR_Read(inFile, ctext, sizeof(ctext))) > 0) {

              count += ctextLen;

              /* decrypt cipher text buffer using CBC and IV */

              rv = Decrypt(ctxenc, decbuf, &decbufLen, sizeof(decbuf),
                           ctext, ctextLen);

              if (rv != SECSuccess) {
                  PR_fprintf(PR_STDERR, "Decrypt Failure\n");
                  goto cleanup;
              }

              if (decbufLen == 0) break;

              rv = MacUpdate(ctxmac, decbuf, decbufLen);
              if (rv != SECSuccess) { goto cleanup; }
              if (count == inFileLength) {
                  decbufLen = decbufLen-paddingLength;
              }

              /* write the plain text to out file */
              temp = PR_Write(outFile, decbuf, decbufLen);
              if (temp != decbufLen) {
                  PR_fprintf(PR_STDERR, "write error\n");
                  rv = SECFailure;
                  break;
              }

              blockNumber++;
          }

          if (rv != SECSuccess) { goto cleanup; }

          rv = MacFinal(ctxmac, newmac, &newmacLen, sizeof(newmac));
          if (rv != SECSuccess) { goto cleanup; }

          if (PORT_Memcmp(macItem->data, newmac, newmacLen) == 0) {
              rv = SECSuccess;
          } else {
              PR_fprintf(PR_STDERR, "Check MAC : Failure\n");
              PR_fprintf(PR_STDERR, "Extracted : ");
              PrintAsAscii(PR_STDERR, macItem->data, macItem->len);
              PR_fprintf(PR_STDERR, "Computed  : ");
              PrintAsAscii(PR_STDERR, newmac, newmacLen);
              rv = SECFailure;
          }
      cleanup:
          if (ctxmac) {
              PK11_DestroyContext(ctxmac, PR_TRUE);
          }
          if (ctxenc) {
              PK11_DestroyContext(ctxenc, PR_TRUE);
          }

          return rv;
      }

      /*
       * Open intermediate file, read in IV, wrapped encryption key,
       * wrapped MAC key, MAC, PAD and public key from header file
       */
      SECStatus
      GetDataFromHeader(const char *headerFileName,
                        SECItem *ivItem,
                        SECItem *wrappedEncKeyItem,
                        SECItem *wrappedMacKeyItem,
                        SECItem *macItem,
                        SECItem *padItem,
                        SECKEYPublicKey **pubKey)
      {
          SECStatus rv = SECSuccess;
          CERTSubjectPublicKeyInfo *keyInfo = NULL;
          SECItem pubKeyData;

          /* Read in the IV into item from the header file */
          rv = ReadFromHeaderFile(headerFileName, IV, ivItem, PR_TRUE);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Could not retrieve IV from cipher file\n");
              goto cleanup;
          }

          rv = ReadFromHeaderFile(headerFileName, SYMKEY, wrappedEncKeyItem, PR_TRUE);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR,
              "Could not retrieve wrapped AES key from header file\n");
              goto cleanup;
          }
          /* Read in the MAC key into item from the header file */
          rv = ReadFromHeaderFile(headerFileName, MACKEY, wrappedMacKeyItem, PR_TRUE);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR,
              "Could not retrieve wrapped MAC key from header file\n");
              goto cleanup;
          }

          /* Get the public key from header file */
          rv = ReadFromHeaderFile(headerFileName, PUBKEY, &pubKeyData, PR_TRUE);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR,
              "Could not retrieve public key from header file\n");
              goto cleanup;
          }
          keyInfo    = SECKEY_DecodeDERSubjectPublicKeyInfo(&pubKeyData);
          if (!keyInfo) {
              PR_fprintf(PR_STDERR, "Could not decode public key\n");
              rv = SECFailure;
              goto cleanup;
          }
          *pubKey = SECKEY_ExtractPublicKey(keyInfo);
          if (*pubKey == NULL) {
              PR_fprintf(PR_STDERR, "Error while getting RSA public key\n");
              rv = SECFailure;
              goto cleanup;
          }
          /* Read in the Mac into item from the header file */
          rv = ReadFromHeaderFile(headerFileName, MAC, macItem, PR_TRUE);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR,
              "Could not retrieve MAC from cipher file\n");
              goto cleanup;
          }
          if (macItem->data == NULL) {
              PR_fprintf(PR_STDERR, "MAC has NULL data\n");
              rv = SECFailure;
              goto cleanup;
          }
          if (macItem->len == 0) {
              PR_fprintf(PR_STDERR, "MAC has data has 0 length\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* Read in the PAD into item from the header file */
          rv = ReadFromHeaderFile(headerFileName, PAD, padItem, PR_TRUE);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR,
              "Could not retrieve PAD detail from header file\n");
              goto cleanup;
          }

      cleanup:
          return rv;
      }


      /*
       * DecryptFile
       */
      SECStatus
      DecryptFile(PK11SlotInfo *slot,
                   const char   *outFileName,
                   const char   *headerFileName,
                   char         *encryptedFileName,
                   secuPWData   *pwdata,
                   PRBool       ascii)
      {
          /*
           * The DB is open read only and we have authenticated to it
           * open input file, read in header, get IV and wrapped keys and
           * public key
           * Unwrap the wrapped keys
           * loop until EOF(input):
           *     read a buffer of ciphertext from input file,
           *     Save last block of ciphertext
           *     decrypt ciphertext buffer using CBC and IV,
           *     compute and check MAC, then remove MAC from plaintext
           *     replace IV with saved last block of ciphertext
           *     write the plain text to output file
           * close files
           * report success
           */

          SECStatus           rv;
          SECItem             ivItem;
          SECItem             wrappedEncKeyItem;
          SECItem             wrappedMacKeyItem;
          SECItem             cipherItem;
          SECItem             macItem;
          SECItem             padItem;
          SECKEYPublicKey    *pubKey              = NULL;
          PK11SymKey         *encKey              = NULL;
          PK11SymKey         *macKey              = NULL;
          SECKEYPrivateKey   *privKey             = NULL;
          PRFileDesc         *outFile             = NULL;
          PRFileDesc         *inFile              = NULL;
          unsigned int       inFileLength         = 0;

          /* open intermediate file, read in header, get IV, public key and
           * CKA_IDs of two keys from it
           */
          rv = GetDataFromHeader(headerFileName,
                                 &ivItem,
                                 &wrappedEncKeyItem,
                                 &wrappedMacKeyItem,
                                 &macItem,
                                 &padItem,
                                 &pubKey);
          if (rv != SECSuccess) {
              goto cleanup;
          }

          /* find private key from the DB token using public key */
          privKey = GetRSAPrivateKey(slot, pwdata, pubKey);
          if (privKey == NULL) {
              PR_fprintf(PR_STDERR, "Can't find private key\n");
              rv = SECFailure;
              goto cleanup;
          }

          encKey = PK11_PubUnwrapSymKey(privKey, &wrappedEncKeyItem,
                                        CKM_AES_CBC, CKA_ENCRYPT, 0);
          if (encKey == NULL) {
              PR_fprintf(PR_STDERR, "Can't unwrap the encryption key\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* CKM_MD5_HMAC or CKM_EXTRACT_KEY_FROM_KEY */
          macKey = PK11_PubUnwrapSymKey(privKey, &wrappedMacKeyItem,
                                        CKM_MD5_HMAC, CKA_SIGN, 160/8);
          if (macKey == NULL) {
              PR_fprintf(PR_STDERR, "Can't unwrap the Mac key\n");
              rv = SECFailure;
              goto cleanup;
          }

          /*  Open the input file.  */
          inFile = PR_Open(encryptedFileName, PR_RDONLY , 0);
          if (!inFile) {
              PR_fprintf(PR_STDERR,
                         "Unable to open \"%s\" for writing.\n",
                         encryptedFileName);
              return SECFailure;
          }
          /*  Open the output file.  */
          outFile = PR_Open(outFileName,
                            PR_CREATE_FILE | PR_TRUNCATE | PR_RDWR , 00660);
          if (!outFile) {
              PR_fprintf(PR_STDERR,
                         "Unable to open \"%s\" for writing.\n",
                         outFileName);
              return SECFailure;
          }
          inFileLength = FileSize(encryptedFileName);

          if (rv == SECSuccess) {
              /* Decrypt and Remove Mac */
              rv = DecryptAndVerifyMac(outFile, inFile, inFileLength,
                      &cipherItem, &macItem, encKey, macKey, &ivItem, &padItem);
              if (rv != SECSuccess) {
                  PR_fprintf(PR_STDERR, "Failed while decrypting and removing MAC\n");
              }
          }

      cleanup:
          if (encKey) {
              PK11_FreeSymKey(encKey);
          }
          if (macKey) {
              PK11_FreeSymKey(macKey);
          }
          if (privKey) {
              SECKEY_DestroyPrivateKey(privKey);
          }
          if (pubKey) {
              SECKEY_DestroyPublicKey(pubKey);
          }
          return rv;
      }

      /*
       * EncryptFile
       */
      SECStatus
      EncryptFile(PK11SlotInfo *slot,
                   const char   *inFileName,
                   const char   *certReqFileName,
                   const char   *headerFileName,
                   const char   *encryptedFileName,
                   const char   *noiseFileName,
                   secuPWData   *pwdata,
                   PRBool       ascii)
      {
          /*
           * The DB is open for read/write and we have authenticated to it.
           * Read public key from certificate request
           * generate a symmetric AES key as a session object.
           * generate a second key to use for MACing, also a session object.
           * generate a random value to use as IV for AES CBC
           * open an input file and an output file,
           * Wrap the symmetric and MAC keys using public key
           * write a header to the output that identifies the two wrapped keys
           * and public key
           * loop until EOF(input)
           *    read a buffer of plaintext from input file,
           *    MAC it, append the MAC to the plaintext
           *    encrypt it using CBC, using previously created IV,
           *    store the last block of ciphertext as the new IV,
           *    write the cipher text to intermediate file
           *    close files
           *    report success
           */
          SECStatus           rv;
          SECKEYPublicKey    *pubKey        = NULL;
          SECItem            *pubKeyData    = NULL;
          PRFileDesc         *inFile        = NULL;
          PRFileDesc         *headerFile    = NULL;
          PRFileDesc         *encFile       = NULL;

          unsigned char      *encKeyId = (unsigned char *) "Encrypt Key";
          unsigned char      *macKeyId = (unsigned char *) "MAC Key";
          SECItem encKeyID = { siAsciiString, encKeyId, PL_strlen(encKeyId) };
          SECItem macKeyID = { siAsciiString, macKeyId, PL_strlen(macKeyId) };

          unsigned char       iv[BLOCKSIZE];
          SECItem             ivItem;
          PK11SymKey         *encKey        = NULL;
          PK11SymKey         *macKey        = NULL;
          SECItem            *wrappedEncKey = NULL;
          SECItem            *wrappedMacKey = NULL;
          unsigned char       c;

          pubKey = ExtractPublicKeyFromCertRequest(certReqFileName, ascii);
          if (pubKey == NULL) {
              PR_fprintf(PR_STDERR, "Error while getting RSA public key\n");
              rv = SECFailure;
              goto cleanup;
          }
          /* generate a symmetric AES key as a token object. */
          encKey = GenerateSYMKey(slot, CKM_AES_KEY_GEN, 128/8, &encKeyID, pwdata);
          if (encKey == NULL) {
              PR_fprintf(PR_STDERR, "GenerateSYMKey for AES returned NULL.\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* generate a second key to use for MACing, also a token object. */
          macKey = GenerateSYMKey(slot, CKM_GENERIC_SECRET_KEY_GEN, 160/8, &macKeyID, pwdata);
          if (macKey == NULL) {
              PR_fprintf(PR_STDERR, "GenerateSYMKey for MACing returned NULL.\n");
              rv = SECFailure;
              goto cleanup;
          }

          /* Wrap encrypt key */
          rv = WrapKey(encKey, pubKey, &wrappedEncKey);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Error while wrapping encrypt key\n");
              goto cleanup;
          }

          /* Wrap Mac key */
          rv = WrapKey(macKey, pubKey, &wrappedMacKey);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Error while wrapping Mac key\n");
              goto cleanup;
          }

          if (noiseFileName) {
              rv = SeedFromNoiseFile(noiseFileName);
              if (rv != SECSuccess) {
                  PORT_SetError(PR_END_OF_FILE_ERROR);
                  return SECFailure;
              }
              rv = PK11_GenerateRandom(iv, BLOCKSIZE);
              if (rv != SECSuccess) {
                  goto cleanup;
              }

          } else {
              /* generate a random value to use as IV for AES CBC */
              GenerateRandom(iv, BLOCKSIZE);
          }

          headerFile = PR_Open(headerFileName,
                               PR_CREATE_FILE | PR_TRUNCATE | PR_RDWR, 00660);
          if (!headerFile) {
              PR_fprintf(PR_STDERR,
                         "Unable to open \"%s\" for writing.\n",
                         headerFileName);
              return SECFailure;
          }
          encFile = PR_Open(encryptedFileName,
                            PR_CREATE_FILE | PR_TRUNCATE | PR_RDWR, 00660);
          if (!encFile) {
              PR_fprintf(PR_STDERR,
                         "Unable to open \"%s\" for writing.\n",
                         encryptedFileName);
              return SECFailure;
          }
          /* write to a header file the IV and the CKA_IDs
           * identifying the two keys
           */
          ivItem.type = siBuffer;
          ivItem.data = iv;
          ivItem.len = BLOCKSIZE;

          rv = WriteToHeaderFile(iv, BLOCKSIZE, IV, headerFile);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Error writing IV to cipher file - %s\n",
                         headerFileName);
              goto cleanup;
          }

          rv = WriteToHeaderFile(wrappedEncKey->data, wrappedEncKey->len, SYMKEY, headerFile);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Error writing wrapped AES key to cipher file - %s\n",
              encryptedFileName);
              goto cleanup;
          }
          rv = WriteToHeaderFile(wrappedMacKey->data, wrappedMacKey->len, MACKEY, headerFile);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Error writing wrapped MAC key to cipher file - %s\n",
                         headerFileName);
              goto cleanup;
          }

          pubKeyData = SECKEY_EncodeDERSubjectPublicKeyInfo(pubKey);
          rv = WriteToHeaderFile(pubKeyData->data, pubKeyData->len, PUBKEY, headerFile);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Error writing wrapped AES key to cipher file - %s\n",
                         headerFileName);
              goto cleanup;
          }

          /*  Open the input file.  */
          inFile = PR_Open(inFileName, PR_RDONLY, 0);
          if (!inFile) {
              PR_fprintf(PR_STDERR, "Unable to open \"%s\" for reading.\n",
                         inFileName);
              return SECFailure;
          }

          /* Macing and Encryption */
          if (rv == SECSuccess) {
              rv = EncryptAndMac(inFile, headerFile, encFile,
                      encKey, macKey, ivItem.data, ivItem.len, ascii);
              if (rv != SECSuccess) {
                  PR_fprintf(PR_STDERR, "Failed : Macing and Encryption\n");
                  goto cleanup;
              }
          }

      cleanup:
          if (inFile) {
              PR_Close(inFile);
          }
          if (headerFile) {
              PR_Close(headerFile);
          }
          if (encFile) {
              PR_Close(encFile);
          }
          if (encKey) {
              PK11_FreeSymKey(encKey);
          }
          if (macKey) {
              PK11_FreeSymKey(macKey);
          }
          if (wrappedEncKey) {
              SECITEM_FreeItem(wrappedEncKey, PR_TRUE);
          }
          if (wrappedMacKey) {
              SECITEM_FreeItem(wrappedMacKey, PR_TRUE);
          }
          if (pubKey) {
              SECKEY_DestroyPublicKey(pubKey);
          }
          if (pubKeyData) {
              SECITEM_FreeItem(pubKeyData, PR_TRUE);
          }
          return rv;
      }

      /*
       * Create certificate request with subject
       */
      SECStatus CreateCertificateRequest(PK11SlotInfo *slot,
                                         const char   *dbdir,
                                         secuPWData   *pwdata,
                                         CERTName     *subject,
                                         const char   *certReqFileName,
                                         PRBool       ascii)
      {
          SECStatus rv;
          SECKEYPrivateKey    *privkey         = NULL;
          SECKEYPublicKey     *pubkey          = NULL;
          KeyType             keytype          = rsaKey;
          int                 keysize          = DEFAULT_KEY_BITS;
          int                 publicExponent   = 0x010001;
          SECOidTag           hashAlgTag       = SEC_OID_UNKNOWN;

          privkey = GeneratePrivateKey(keytype, slot, keysize,
                                       publicExponent, NULL,
                                       &pubkey, NULL, pwdata);
          if (privkey == NULL) {
              PR_fprintf(PR_STDERR, "unable to generate key(s)\n");
              rv = SECFailure;
              goto cleanup;
          }
          privkey->wincx = pwdata;
          PORT_Assert(pubkey != NULL);

          rv = CertReq(privkey, pubkey, keytype, hashAlgTag, subject,
                       ascii, certReqFileName);

          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "Failed to create Certificate Request\n");
          }
      cleanup:
          if (privkey) {
              SECKEY_DestroyPrivateKey(privkey);
          }
          if (pubkey) {
              SECKEY_DestroyPublicKey(pubkey);
          }
          return rv;
      }

      /*
       * This example illustrates basic encryption/decryption and MACing
       * Generates the RSA key pair as token object and outputs public key as cert request.
       * Generates the encryption/mac keys as session objects.
       * Encrypts/MACs the input file using encryption keys and outputs the encrypted
       * contents into intermediate header file.
       * Extracts the public key from cert request file and Wraps the encryption keys using
       * RSA public key and outputs wrapped keys and public key into intermediate header file.
       * Reads the intermediate headerfile for wrapped keys,RSA public key and encrypted
       * contents and decrypts into output file.
       *
       * How this sample is different from sample 4 ?
       *
       * 1. Generate same keys as sample 4, outputs public key as cert request.
       * 2. Like sample 4, except that it reads in public key from cert request file instead
       *    of looking it up by label name, and writes public key into header instead of a
       *    label name. Rest is the same.
       * 3. Like sample 4, except that it reads in RSA public key, and then finds matching
       *    private key (by key ID).  Rest is the same.
       */
      int
      main(int argc, char **argv)
      {
          SECStatus           rv;
          SECStatus           rvShutdown;
          PLOptState          *optstate;
          PLOptStatus         status;
          char                headerFileName[50];
          char                encryptedFileName[50];
          PK11SlotInfo        *slot                = NULL;
          PRBool              ascii                = PR_FALSE;
          CommandType         cmd                  = UNKNOWN;
          PRFileDesc          *inFile              = NULL;
          PRFileDesc          *outFile             = NULL;
          char                *subjectStr          = NULL;
          CERTName            *subject             = NULL;
          const char          *dbdir               = NULL;
          const char          *inFileName          = NULL;
          const char          *outFileName         = NULL;
          const char          *certReqFileName     = NULL;
          const char          *noiseFileName       = NULL;
          secuPWData          pwdata               = { PW_NONE, 0 };

          char * progName = strrchr(argv[0], '/');
          progName = progName ? progName + 1 : argv[0];

          /* Parse command line arguments */
          optstate = PL_CreateOptState(argc, argv, "c:d:i:o:f:p:z:a:s:r:");
          while ((status = PL_GetNextOpt(optstate)) == PL_OPT_OK) {
              switch (optstate->option) {
              case 'a':
                  ascii = PR_TRUE;
                  break;
              case 'c':
                  cmd = option2Command(optstate->value);
                  break;
              case 'd':
                  dbdir = strdup(optstate->value);
                  break;
              case 'f':
                  pwdata.source = PW_FROMFILE;
                  pwdata.data = strdup(optstate->value);
                  break;
              case 'p':
                  pwdata.source = PW_PLAINTEXT;
                  pwdata.data = strdup(optstate->value);
                  break;
              case 'i':
                  inFileName = strdup(optstate->value);
                  break;
              case 'o':
                  outFileName = strdup(optstate->value);
                  break;
              case 'r':
                  certReqFileName = strdup(optstate->value);
                  break;
              case 's':
                  subjectStr  = strdup(optstate->value);
                  subject     = CERT_AsciiToName(subjectStr);
                  break;
              case 'z':
                  noiseFileName = strdup(optstate->value);
                  break;
              default:
                  Usage(progName);
                  break;
              }
          }
          PL_DestroyOptState(optstate);

          if (cmd == UNKNOWN || !dbdir) {
              Usage(progName);
          }

          /* For intermediate header file, choose filename as inputfile name
             with extension ".header" */
          strcpy(headerFileName, progName);
          strcat(headerFileName, ".header");

          /* For intermediate encrypted file, choose filename as inputfile name
             with extension ".enc" */
          strcpy(encryptedFileName, progName);
          strcat(encryptedFileName, ".enc");
          PR_Init(PR_USER_THREAD, PR_PRIORITY_NORMAL, 0);

          /* Open DB for read/write and authenticate to it. */
          rv = NSS_InitReadWrite(dbdir);
          if (rv != SECSuccess) {
              PR_fprintf(PR_STDERR, "NSS_InitReadWrite Failed\n");
              goto cleanup;
          }

          PK11_SetPasswordFunc(GetModulePassword);
          slot = PK11_GetInternalKeySlot();
          rv = PK11_Authenticate(slot, PR_TRUE, &pwdata);
          if (rv != SECSuccess) {
               PR_fprintf(PR_STDERR, "Could not authenticate to token %s.\n",
                          PK11_GetTokenName(slot));
               goto cleanup;
          }

          switch (cmd) {
          case GEN_CSR:

              /* Validate command for Generate CSR */
              if (!certReqFileName || !subject) {
                  Usage(progName);
              }
              /*
               * Generate the cert request and save it
               * in a file so public key can be retrieved later to wrap the symmetric key
               */
              rv = CreateCertificateRequest(slot, dbdir, &pwdata, subject, certReqFileName, ascii);
              if (rv != SECSuccess) {
                  PR_fprintf(PR_STDERR, "Create Certificate Request: Failed\n");
                  goto cleanup;
              }
              break;
          case ENCRYPT:
              /* Validate command for Encrypt */
              if (!certReqFileName && !inFileName) {
                  Usage(progName);
              }

              /*
               * Read cert request from a file and extract public key
               * Generates an AES encryption key, session object
               * Generates a MAC key, session object
               * Wraps each of those keys with RSA public key
               * Write wrapped keys and public key into intermediate header file
               * Encryption and MACing loop
               * Destroy session keys
               * Close files
               */
              rv = EncryptFile(slot, inFileName, certReqFileName,
                               headerFileName, encryptedFileName,
                               noiseFileName, &pwdata, ascii);
              if (rv != SECSuccess) {
                  PR_fprintf(PR_STDERR, "EncryptFile : Failed\n");
                  return SECFailure;
              }
              break;
          case DECRYPT:
              /* Validate command for Decrypt */
              if (!inFileName && !outFileName) {
                  Usage(progName);
              }
              /*
               * Reads intermediate header including public key and wrapped keys
               * Finds RSA private key corresponding to the public key
               * unwraps two keys, creating session key objects
               * Decryption and MAC checking loop to write to output file
               * Destroy session keys
               * CLose files
               */
              rv = DecryptFile(slot,
                        outFileName, headerFileName,
                        encryptedFileName, &pwdata, ascii);
              if (rv != SECSuccess) {
                  PR_fprintf(PR_STDERR, "DecryptFile : Failed\n");
                  return SECFailure;
              }
              break;
          }

      cleanup:
          if (slot) {
              PK11_FreeSlot(slot);
          }
          rvShutdown = NSS_Shutdown();
          if (rvShutdown != SECSuccess) {
              PR_fprintf(PR_STDERR, "Failed : NSS_Shutdown()\n");
              rv = SECFailure;
          }
          PR_Cleanup();

          return rv;
      }