const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border bg-muted/50">
      <div className="container mx-auto flex flex-col items-center justify-center gap-1 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:gap-3">
        <span>Copyright © 2026 | Zaqueu Fernandes | Suporte Técnico</span>
        <a
          href="https://wa.me/5588994014262"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-[hsl(142,72%,40%)] hover:underline"
        >
          <i className="fa-brands fa-whatsapp text-sm" />
          WhatsApp: 88 99401-4262
        </a>
      </div>
    </footer>
  );
};

export default Footer;
