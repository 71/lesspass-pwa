declare module 'lesspass' {
  interface PasswordGenerationOptions {
    site: string
    login: string
    counter: number
    length: number
    lowercase: boolean
    uppercase: boolean
    digits: boolean
    symbols: boolean
  }

  function generatePassword(options: PasswordGenerationOptions, masterPassword: string): Promise<string>
}

declare module 'lesspass-fingerprint' {
  function createHmac(digest: string, string: string, salt?: string): Promise<string>
}
