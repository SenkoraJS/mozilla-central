.. _mozilla_projects_nss_nss_sample_code_nss_sample_code_sample2:

NSS Sample Code sample2
=======================

.. _nss_sample_code_2_symmetric_encryption:

`NSS Sample Code 2: Symmetric Encryption <#nss_sample_code_2_symmetric_encryption>`__
-------------------------------------------------------------------------------------

.. container::

   .. code::

      /* Example code to illustrate DES enccryption/decryption using NSS.
       * The example skips the details of obtaining the Key & IV to use, and
       * just uses a hardcoded Key & IV.
       * Note: IV is only needed if Cipher Blocking Chaining (CBC) mode of encryption
       *       is used
       *
       * The recommended approach is to store and transport WRAPPED (encrypted)
       * DES Keys (IVs can be in the clear). However, it is a common (and dangerous)
       * practice to use raw DES Keys. This example shows the use of a RAW key.
       */


      #include "nss.h"
      #include "pk11pub.h"

      /* example Key & IV */
      unsigned char gKey[] = {0xe8, 0xa7, 0x7c, 0xe2, 0x05, 0x63, 0x6a, 0x31};
      unsigned char gIV[] = {0xe4, 0xbb, 0x3b, 0xd3, 0xc3, 0x71, 0x2e, 0x58};

      int main(int argc, char **argv)
      {
        CK_MECHANISM_TYPE  cipherMech;
        PK11SlotInfo*      slot = NULL;
        PK11SymKey*        SymKey = NULL;
        SECItem*           SecParam = NULL;
        PK11Context*       EncContext = NULL;
        SECItem            keyItem, ivItem;
        SECStatus          rv, rv1, rv2;
        unsigned char      data[1024], buf1[1024], buf2[1024];
        int                i, result_len, tmp1_outlen, tmp2_outlen;

        /* Initialize NSS
         * If your application code has already initialized NSS, you can skip it
         * here.
         * This code uses the simplest of the Init functions, which does not
         * require a NSS database to exist
         */
        rv = NSS_NoDB_Init(".");
        if (rv != SECSuccess)
        {
          fprintf(stderr, "NSS initialization failed (err %d)\n",
                  PR_GetError());
          goto out;
        }

        /* choose mechanism: CKM_DES_CBC_PAD, CKM_DES3_ECB, CKM_DES3_CBC.....
         * Note that some mechanisms (*_PAD) imply the padding is handled for you
         * by NSS. If you choose something else, then data padding is the
         * application's responsibility
         */
        cipherMech = CKM_DES_CBC_PAD;
        slot = PK11_GetBestSlot(cipherMech, NULL);
        /* slot = PK11_GetInternalKeySlot(); is a simpler alternative but in
         * theory, it *may not* return the optimal slot for the operation. For
         * DES ops, Internal slot is typically the best slot
         */
        if (slot == NULL)
        {
          fprintf(stderr, "Unable to find security device (err %d)\n",
                  PR_GetError());
          goto out;
        }

        /* NSS passes blobs around as SECItems. These contain a pointer to
         * data and a length. Turn the raw key into a SECItem. */
        keyItem.type = siBuffer;
        keyItem.data = gKey;
        keyItem.len = sizeof(gKey);

        /* Turn the raw key into a key object. We use PK11_OriginUnwrap
         * to indicate the key was unwrapped - which is what should be done
         * normally anyway - using raw keys isn't a good idea */
        SymKey = PK11_ImportSymKey(slot, cipherMech, PK11_OriginUnwrap, CKA_ENCRYPT,
                                   &keyItem, NULL);
        if (SymKey == NULL)
        {
          fprintf(stderr, "Failure to import key into NSS (err %d)\n",
                  PR_GetError());
          goto out;
        }

        /* set up the PKCS11 encryption parameters.
         * when not using CBC mode, ivItem.data and ivItem.len can be 0, or you
         * can simply pass NULL for the iv parameter in PK11_ParamFromIV func
         */
        ivItem.type = siBuffer;
        ivItem.data = gIV;
        ivItem.len = sizeof(gIV);
        SecParam = PK11_ParamFromIV(cipherMech, &ivItem);
        if (SecParam == NULL)
        {
          fprintf(stderr, "Failure to set up PKCS11 param (err %d)\n",
                  PR_GetError());
          goto out;
        }

        /* sample data we'll encrypt and decrypt */
        strcpy(data, "Encrypt me!");
        fprintf(stderr, "Clear Data: %s\n", data);

        /* ========================= START SECTION ============================= */
        /* If using the same key and iv over and over, stuff before this         */
        /* section and after this section needs to be done only ONCE             */

        /* ENCRYPT data into buf1. buf1 len must be atleast (data len + 8) */
        tmp1_outlen = tmp2_outlen = 0;

        /* Create cipher context */
        EncContext = PK11_CreateContextBySymKey(cipherMech, CKA_ENCRYPT,
                                                SymKey, SecParam);
        rv1 = PK11_CipherOp(EncContext, buf1, &tmp1_outlen, sizeof(buf1),
                            data, strlen(data)+1);
        rv2 = PK11_DigestFinal(EncContext, buf1+tmp1_outlen, &tmp2_outlen,
                               sizeof(buf1)-tmp1_outlen);
        PK11_DestroyContext(EncContext, PR_TRUE);
        result_len = tmp1_outlen + tmp2_outlen;
        if (rv1 != SECSuccess || rv2 != SECSuccess)
          goto out;

        fprintf(stderr, "Encrypted Data: ");
        for (i=0; i<result_len; i++)
          fprintf(stderr, "%02x ", buf1[i]);
        fprintf(stderr, "\n");


        /* DECRYPT buf1 into buf2. buf2 len must be atleast buf1 len */
        tmp1_outlen = tmp2_outlen = 0;

        /* Create cipher context */
        EncContext = PK11_CreateContextBySymKey(cipherMech, CKA_DECRYPT,
                                                SymKey, SecParam);
        rv1 = PK11_CipherOp(EncContext, buf2, &tmp1_outlen, sizeof(buf2),
                            buf1, result_len);
        rv2 = PK11_DigestFinal(EncContext, buf2+tmp1_outlen, &tmp2_outlen,
                               result_len-tmp1_outlen);
        PK11_DestroyContext(EncContext, PR_TRUE);
        result_len = tmp1_outlen + tmp2_outlen;
        if (rv1 != SECSuccess || rv2 != SECSuccess)
          goto out;

        fprintf(stderr, "Decrypted Data: %s\n", buf2);

        /* =========================== END SECTION ============================= */


      out:
        if (SymKey)
          PK11_FreeSymKey(SymKey);
        if (SecParam)
          SECITEM_FreeItem(SecParam, PR_TRUE);

      }