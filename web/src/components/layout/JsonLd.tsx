export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NONXDEV STUDIO',
    url: 'https://nonxdev.com',
    logo: 'https://nonxdev.com/images/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+66-83-029-2314',
      contactType: 'customer service',
      email: 'nonxdev@gmail.com',
      areaServed: 'TH',
      availableLanguage: ['Thai', 'English']
    },
    sameAs: [
      'https://facebook.com/nonxdev',
      'https://linkedin.com/company/nonxdev'
    ],
    description: 'NONXDEV STUDIO รับเขียนโปรแกรม ทำเว็บไซต์ และระบบ AI Automation ครบวงจร'
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
