/* eslint-disable react-refresh/only-export-components */
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  keywords?: string;
  author?: string;
  schemaMarkup?: object;
}

const SEO = ({
  title = 'Tarkov Task Tracker - Quest Mind Map & Progression Tool',
  description = 'Interactive Escape from Tarkov quest tracker with dependency visualization, collector items, and trader progression. Plan your PMC journey with our comprehensive task mind map.',
  canonical,
  image = '/kappas.png',
  imageAlt = 'Tarkov Task Tracker - Kappa Container Quest Tool',
  type = 'website',
  siteName = 'Tarkov Task Tracker',
  twitterCard = 'summary_large_image',
  keywords = 'Escape from Tarkov, EFT, quest tracker, task progression, PMC, collector items, trader levels, Kappa container, tarkov quests, tarkov guide',
  author = 'Tarkov Task Tracker',
  schemaMarkup
}: SEOProps) => {
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;
  const fullCanonicalUrl = canonical || window.location.href;

  const defaultSchemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteName,
    description,
    url: window.location.origin,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    author: {
      '@type': 'Organization',
      name: author
    },
    about: {
      '@type': 'VideoGame',
      name: 'Escape from Tarkov',
      genre: 'First-person shooter, Survival game'
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />
      
      {/* Additional Meta Tags for Gaming/Tool Apps */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="application-name" content={siteName} />
      
      {/* Structured Data (Schema Markup) */}
      <script type="application/ld+json">
        {JSON.stringify(schemaMarkup || defaultSchemaMarkup)}
      </script>
    </Helmet>
  );
};

export default SEO;
