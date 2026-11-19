import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import './site.css';

export default function SiteChrome({ page, skipHref = '#main-content', children }) {
  return (
    <>
      <a href={skipHref} className="skip-to-content">Skip to main content</a>
      <SiteHeader page={page} />
      {children}
      <SiteFooter />
    </>
  );
}
