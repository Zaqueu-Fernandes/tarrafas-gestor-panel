import { Button } from '@/components/ui/button';

const WhatsAppButton = ({ className }: { className?: string }) => (
  <Button
    asChild
    className={`bg-[hsl(142,72%,40%)] hover:bg-[hsl(142,72%,35%)] text-white ${className ?? ''}`}
  >
    <a href="https://wa.me/5588994014262" target="_blank" rel="noopener noreferrer">
      <i className="fa-brands fa-whatsapp mr-2" />
      WhatsApp Suporte
    </a>
  </Button>
);

export default WhatsAppButton;
