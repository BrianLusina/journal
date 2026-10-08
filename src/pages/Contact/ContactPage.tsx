import Social from "@/features/Social/Social";

// The contact form is gone until there is a backend to send messages to: a form that only
// pretended to send made readers think they had reached us (BrianLusina/journal#805).
const ContactPage = () => {
  return (
    <>      
      {/* Hero Section */}
      <div className="mb-16 text-center space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
          Get in Touch
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
          Have a question, suggestion, or just want to say hello? We'd love to hear from you.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Links */}
        <div className="rounded-2xl bg-card p-8">
          <h2 className="text-2xl font-bold mb-6">Find us online</h2>
          <p className="text-muted-foreground mb-6">
            We don't have a contact form yet. Until we do, you can reach us here:
          </p>
          <div className="[&_a]:underline [&_a:hover]:text-accent">
            <Social />
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl bg-muted p-8">
            <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Can I contribute to Journal?</h4>
                <p className="text-muted-foreground">
                  Yes! We welcome guest contributions. Send your pitch or article idea through one of the links on this page.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How do I advertise with you?</h4>
                <p className="text-muted-foreground">
                  For advertising inquiries, reach out through one of the links on this page with details about your brand.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Can I republish your content?</h4>
                <p className="text-muted-foreground">
                  Please contact us for permissions and licensing. We're generally open to republishing with proper attribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
