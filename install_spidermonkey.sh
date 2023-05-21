#!/usr/bin/env bash

if ! command -v gh version &> /dev/null
then
    echo "Github CLI could not be found"
    exit
fi


LATEST_RUN_ID=$(gh run list --repo SenkoraJS/mozilla-central --workflow Build --json databaseId --jq .[0].databaseId)
TEMP_DIRECTORY=$(mktemp -d)

echo "Downloading include artifacts from run $LATEST_RUN_ID to $TEMP_DIRECTORY"
gh run download $LATEST_RUN_ID --repo SenkoraJS/mozilla-central --name include --dir $TEMP_DIRECTORY/include

echo "Downloading bin artifacts from run $LATEST_RUN_ID to $TEMP_DIRECTORY"
gh run download $LATEST_RUN_ID --repo SenkoraJS/mozilla-central --name bin --dir $TEMP_DIRECTORY/bin

echo "Downloading lib artifacts from run $LATEST_RUN_ID to $TEMP_DIRECTORY"
gh run download $LATEST_RUN_ID --repo SenkoraJS/mozilla-central --name lib --dir $TEMP_DIRECTORY/lib

echo ""
echo "Extracting artifacts"

MOZJS=$(basename $(find $TEMP_DIRECTORY/lib -name lib*.so))
MOZJS_WITHOUT_TYPE=${MOZJS%.*}

MOZJS_VERSION=$(echo $MOZJS_WITHOUT_TYPE | cut -d'-' -f 2)

# Copy binaries to /usr/bin
echo "Copying binaries to /usr/bin"
cp $TEMP_DIRECTORY/bin/js /usr/bin/js$MOZJS_VERSION
cp $TEMP_DIRECTORY/bin/js-config /usr/bin/js-config$MOZJS_VERSION

# Make binaries executable
echo "Making binaries executable"
chmod u+x /usr/bin/js$MOZJS_VERSION
chmod u+x /usr/bin/js-config$MOZJS_VERSION

# Copy libraries to /usr/lib
echo "Copying libraries to /usr/lib"
cp $TEMP_DIRECTORY/lib/$MOZJS /usr/lib/libmozjs-$MOZJS_VERSION.so
cp $TEMP_DIRECTORY/lib/pkgconfig/js.pc /usr/lib/pkgconfig/mozjs-$MOZJS_VERSION.pc

# Copy includes to /usr/include
echo "Copying includes to /usr/include/mozjs-$MOZJS_VERSION"
mkdir -p /usr/include/mozjs-$MOZJS_VERSION
cp -r $TEMP_DIRECTORY/include/* /usr/include/mozjs-$MOZJS_VERSION

echo ""
echo "Cleaning up"
rm -rf $TEMP_DIRECTORY

echo "Done"
