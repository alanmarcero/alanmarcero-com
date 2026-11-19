import '../App.css';
import '../plugins/plugins.css';
import SiteChrome from '../site/SiteChrome';
import ContactForm from '../components/ContactForm';

export default function ContactPage() {
  return (
    <SiteChrome page="contact">
      <main id="main-content">
        <section id="contact" aria-labelledby="contact-heading">
          <div className="section-head">
            <h1 id="contact-heading" className="section-title" data-kicker="Contact">Get in Touch</h1>
          </div>
          <p className="section-lead">Send a note.</p>
          <ContactForm />
        </section>
      </main>
    </SiteChrome>
  );
}
