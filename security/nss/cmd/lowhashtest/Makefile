#! gmake
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

#######################################################################
# (1) Include initial platform-independent assignments (MANDATORY).   #
#######################################################################

include manifest.mn
#MKPROG = purify -cache-dir=/u/mcgreer/pcache -best-effort \
#	-always-use-cache-dir $(CC)

#######################################################################
# (2) Include "global" configuration information. (OPTIONAL)          #
#######################################################################

include $(CORE_DEPTH)/coreconf/config.mk

#######################################################################
# (3) Include "component" configuration information. (OPTIONAL)       #
#######################################################################


#######################################################################
# (4) Include "local" platform-dependent assignments (OPTIONAL).      #
#######################################################################


#######################################################################
# (5) Execute "global" rules. (OPTIONAL)                              #
#######################################################################

include $(CORE_DEPTH)/coreconf/rules.mk

#######################################################################
# (6) Execute "component" rules. (OPTIONAL)                           #
#######################################################################

# $(PROGRAM) has explicit dependencies on $(EXTRA_LIBS)
EXTRA_LIBS += \
	$(DIST)/lib/$(LIB_PREFIX)sectool.$(LIB_SUFFIX) \
	$(NULL)


EXTRA_SHARED_LIBS += \
	-L$(DIST)/lib \
	-L$(NSSUTIL_LIB_DIR) \
	-lfreebl3 \
	$(NULL)

#######################################################################
# (7) Execute "local" rules. (OPTIONAL).                              #
#######################################################################

include ../platrules.mk
