/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

#ifndef mozilla_SandboxTestingChild_h
#define mozilla_SandboxTestingChild_h

#include "mozilla/PSandboxTestingChild.h"
#include "mozilla/Maybe.h"
#include "mozilla/Monitor.h"
#include "mozilla/StaticPtr.h"
#include "mozilla/UniquePtr.h"
#include "nsISupports.h"

#ifdef XP_UNIX
#  include "nsString.h"
#endif

#if !defined(MOZ_SANDBOX) || !defined(MOZ_DEBUG) || !defined(ENABLE_TESTS)
#  error "This file should not be used outside of debug with tests"
#endif

namespace mozilla {

class SandboxTestingThread;

/**
 * Runs tests that check sandbox in child process, depending on process type.
 */
class SandboxTestingChild : public PSandboxTestingChild {
 public:
  static bool Initialize(
      Endpoint<PSandboxTestingChild>&& aSandboxTestingEndpoint);
  static SandboxTestingChild* GetInstance();
  static void Destroy();

  NS_INLINE_DECL_THREADSAFE_REFCOUNTING(SandboxTestingChild, override)

  bool IsTestThread();
  void PostToTestThread(already_AddRefed<nsIRunnable>&& runnable);

  void ActorDestroy(ActorDestroyReason aWhy) override;

  virtual ipc::IPCResult RecvShutDown();

  // Helper to return that no test have been executed. Tests should make sure
  // they have some fallback through that otherwise the framework will consider
  // absence of test report as a failure.
  inline void ReportNoTests();

  // For test cases that return an error number or 0, like newer POSIX
  // APIs.  If `aExpectSuccess` is true, the test passes if the status is
  // 0; otherwise, the test requires a specific error if `aExpectedError`
  // is `Some(n)` or any nonzero status if it's `Nothing()`.
  void PosixTest(const nsCString& aName, bool aExpectSuccess, int aStatus,
                 Maybe<int> aExpectedError = Nothing());

  // For test cases that return a negative number and set `errno` to
  // indicate error, like classical Unix APIs; takes a callable, which
  // is used only in this function call (so `[&]` captures are safe).
  template <typename F>
  void ErrnoTest(const nsCString& aName, bool aExpectSuccess, F&& aFunction);

  // Similar to ErrnoTest, except that we want to compare a specific `errno`
  // being returned.
  template <typename F>
  void ErrnoValueTest(const nsCString& aName, int aExpectedErrno,
                      F&& aFunction);

 private:
  explicit SandboxTestingChild(SandboxTestingThread* aThread,
                               Endpoint<PSandboxTestingChild>&& aEndpoint);
  ~SandboxTestingChild();

  void Bind(Endpoint<PSandboxTestingChild>&& aEndpoint);

  UniquePtr<SandboxTestingThread> mThread;

  static StaticRefPtr<SandboxTestingChild> sInstance;
};

}  // namespace mozilla

#endif  // mozilla_SandboxTestingChild_h
