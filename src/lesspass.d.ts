declare module 'lesspass' {
  interface Profile {
    counter: number
    length: number
    lowercase: boolean
    uppercase: boolean
    numbers: boolean
    symbols: boolean
  }

  function generatePassword(site: string, login: string, masterPassword: string, profile: Profile): Promise<string>
}

declare module 'lesspass-fingerprint' {
  function createHmac(digest: string, string: string, salt?: string): Promise<string>
}
