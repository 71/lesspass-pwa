declare module 'lesspass-entropy' {
  interface ProfileOptions {
    counter: number
  }

  interface ProfileCryptoOptions {
    iterations: number
    keylen: 32
    digest: "sha-1" | "sha256" | "sha512"
  }

  interface Profile {
    site: string
    login: string
    options: ProfileOptions
    crypto: ProfileCryptoOptions
  }

  function calcEntropy(profile: Profile, masterPassword: string): Promise<string>
}

declare module 'lesspass-render-password' {
  interface PasswordRenderOptions {
    length: number
    lowercase: boolean
    uppercase: boolean
    digits: boolean
    symbols: boolean
  }

  function renderPassword(entropy: string, options: PasswordRenderOptions): string
}

declare module 'lesspass-fingerprint' {
  function createHmac(digest: string, string: string, salt?: string): Promise<string>
}
