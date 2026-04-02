const Footer = () => (
  <footer className="bg-gradient-green-dark py-10 text-primary-foreground">
    <div className="container mx-auto px-4 text-center">
      <h3 className="mb-3 font-heading text-xl font-bold tracking-wider">KIRA STORE</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-primary-foreground/80">
        ដឹកជញ្ជូនរហ័ស។ ការទូទាត់ដែលមានសុវត្ថិភាព។ សេវាកម្មបញ្ចូលទឹកប្រាក់ដែលអាចទុកចិត្តបានសម្រាប់អ្នកលេងហ្គេមទូទាំងពិភពលោក។
      </p>

      <div className="mb-6 flex items-center justify-center gap-4">
        {[
          { name: 'Facebook', icon: 'f' },
          { name: 'Telegram', icon: '✈' },
          { name: 'TikTok', icon: '♪' },
        ].map(s => (
          <a
            key={s.name}
            href="#"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground transition-colors hover:bg-primary-foreground/25"
          >
            <span className="text-lg">{s.icon}</span>
          </a>
        ))}
      </div>

      <hr className="mx-auto mb-4 max-w-md border-primary-foreground/20" />

      <p className="mb-4 text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} KIRA STORE រក្សាសិទ្ធិ​គ្រប់​យ៉ាង។
      </p>

      <div className="flex items-center justify-center gap-3">
        <span className="font-heading text-sm font-bold text-primary-foreground/80">យើងទទួលយក:</span>
        <span className="rounded-md bg-accent px-3 py-1 font-heading text-xs font-bold text-accent-foreground">KHQR</span>
        <span className="rounded-md bg-blue-700 px-3 py-1 font-heading text-xs font-bold text-primary-foreground">ABA</span>
      </div>
    </div>
  </footer>
);

export default Footer;
