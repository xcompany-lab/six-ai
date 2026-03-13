import {
  FileText, BookOpen, UserCheck, Settings2, Bot, ShieldCheck,
  Award, AlertTriangle, Ban, RefreshCw, Scale, MapPin, Mail
} from 'lucide-react';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

const sections: LegalSection[] = [
  {
    id: 'aceitacao',
    title: 'Aceitação dos Termos',
    icon: FileText,
    content: (
      <>
        <p>Ao acessar e utilizar a plataforma SIX AI ("Plataforma"), você concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, não utilize a Plataforma.</p>
        <p>O uso continuado da Plataforma após quaisquer alterações nestes Termos constitui aceitação das modificações realizadas.</p>
      </>
    ),
  },
  {
    id: 'definicoes',
    title: 'Definições',
    icon: BookOpen,
    content: (
      <ul className="list-disc pl-5 space-y-2">
        <li><strong className="text-foreground">SIX AI:</strong> plataforma SaaS de automação comercial com inteligência artificial, desenvolvida pela X-Company Tech AI.</li>
        <li><strong className="text-foreground">Atendente IA:</strong> agente de inteligência artificial configurável que realiza atendimento automatizado via WhatsApp.</li>
        <li><strong className="text-foreground">Usuário:</strong> pessoa física ou jurídica que se cadastra e utiliza a Plataforma.</li>
        <li><strong className="text-foreground">Leads:</strong> contatos comerciais gerenciados dentro do CRM da Plataforma.</li>
        <li><strong className="text-foreground">Agendamentos:</strong> compromissos criados e gerenciados pela Plataforma, com integração opcional ao Google Calendar.</li>
        <li><strong className="text-foreground">Campanhas de Ativação:</strong> disparos de mensagens em massa via WhatsApp para reativação de base de contatos.</li>
      </ul>
    ),
  },
  {
    id: 'cadastro',
    title: 'Cadastro e Conta',
    icon: UserCheck,
    content: (
      <>
        <p>Para utilizar a Plataforma, o Usuário deve criar uma conta fornecendo informações verdadeiras, completas e atualizadas. O Usuário é responsável por manter a confidencialidade de suas credenciais de acesso.</p>
        <p>Cada conta é pessoal e intransferível. O Usuário é responsável por todas as atividades realizadas em sua conta.</p>
        <p>O processo de onboarding coleta dados do perfil empresarial (nome do negócio, nicho, serviços, tom de voz) para configuração personalizada do Atendente IA.</p>
      </>
    ),
  },
  {
    id: 'funcionalidades',
    title: 'Funcionalidades da Plataforma',
    icon: Settings2,
    content: (
      <>
        <p>A SIX AI oferece as seguintes funcionalidades principais:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-foreground">CRM Inteligente:</strong> gestão de leads com classificação automática por IA (novo, qualificado, agendado, cliente, perdido).</li>
          <li><strong className="text-foreground">Atendente IA:</strong> atendimento automatizado via WhatsApp com IA generativa, configurável por tom de voz, FAQ, objeções e base de conhecimento.</li>
          <li><strong className="text-foreground">Agendamentos:</strong> sistema de agendamento com integração ao Google Calendar, lembretes automáticos e confirmação via WhatsApp. A integração com Google Agenda requer autorização OAuth 2.0 explícita do Usuário, solicitando apenas o escopo <code className="bg-muted px-1 rounded">calendar.events</code> (leitura e escrita de eventos). Nenhum outro dado da conta Google é acessado.</li>
          <li><strong className="text-foreground">Follow-up Automático:</strong> fluxos de acompanhamento personalizáveis com gatilhos baseados em status do lead.</li>
          <li><strong className="text-foreground">Ativação de Base:</strong> campanhas de reativação com segmentação, sugestão IA de mensagens e agendamento de disparos.</li>
          <li><strong className="text-foreground">Kanban:</strong> visualização e gestão do pipeline comercial.</li>
          <li><strong className="text-foreground">Insights e Relatórios:</strong> dashboard analítico com métricas de conversão, performance da IA e análise de sentimento.</li>
        </ul>
        <p>A disponibilidade das funcionalidades varia conforme o plano contratado (Trial, Starter, Pro, Enterprise).</p>
      </>
    ),
  },
  {
    id: 'inteligencia-artificial',
    title: 'Inteligência Artificial',
    icon: Bot,
    content: (
      <>
        <p>A Plataforma utiliza modelos de IA generativa (Google Gemini) para gerar respostas automatizadas, sugestões de mensagens e análises. O Usuário reconhece que:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>As respostas geradas pela IA são baseadas nas configurações fornecidas pelo Usuário e podem não ser perfeitas em todas as situações.</li>
          <li>O Usuário é responsável por revisar e ajustar as configurações do Atendente IA (prompt, FAQ, objeções, palavras proibidas).</li>
          <li>A SIX AI não se responsabiliza por respostas inadequadas geradas pela IA quando o Usuário não configurou adequadamente as diretrizes.</li>
          <li>O uso da IA está sujeito a limites de acordo com o plano contratado.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'dados-privacidade',
    title: 'Dados e Privacidade',
    icon: ShieldCheck,
    content: (
      <>
        <p>O tratamento de dados pessoais pela Plataforma está descrito em nossa <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>, que é parte integrante destes Termos.</p>
        <p>O Usuário é responsável por obter o consentimento necessário de seus clientes/leads para o envio de mensagens via WhatsApp e armazenamento de dados na Plataforma, em conformidade com a LGPD (Lei Geral de Proteção de Dados — Lei nº 13.709/2018).</p>
      </>
    ),
  },
  {
    id: 'propriedade-intelectual',
    title: 'Propriedade Intelectual',
    icon: Award,
    content: (
      <>
        <p>Todo o conteúdo da Plataforma, incluindo mas não se limitando a software, design, logotipos, textos, gráficos e interfaces, é de propriedade exclusiva da X-Company Tech AI ou de seus licenciadores.</p>
        <p>O Usuário não adquire qualquer direito de propriedade intelectual sobre a Plataforma pelo simples uso. É vedada a reprodução, modificação, distribuição ou engenharia reversa da Plataforma.</p>
        <p>Os dados e conteúdos inseridos pelo Usuário permanecem de sua propriedade.</p>
      </>
    ),
  },
  {
    id: 'limitacao-responsabilidade',
    title: 'Limitação de Responsabilidade',
    icon: AlertTriangle,
    content: (
      <>
        <p>A SIX AI não se responsabiliza por:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Indisponibilidade temporária da Plataforma por motivos técnicos, manutenção ou força maior.</li>
          <li>Ações tomadas por terceiros (como bloqueio de número pelo WhatsApp) decorrentes do uso da Plataforma.</li>
          <li>Perdas comerciais resultantes de respostas geradas pela IA sem a devida configuração pelo Usuário.</li>
          <li>Falhas em integrações de terceiros (WhatsApp via Evolution API, Google Calendar).</li>
          <li>Danos indiretos, incidentais ou consequentes de qualquer natureza.</li>
        </ul>
        <p>A responsabilidade total da SIX AI está limitada ao valor pago pelo Usuário nos últimos 3 meses de uso.</p>
      </>
    ),
  },
  {
    id: 'suspensao-cancelamento',
    title: 'Suspensão e Cancelamento',
    icon: Ban,
    content: (
      <>
        <p>A SIX AI pode suspender ou cancelar a conta do Usuário nos seguintes casos:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Violação destes Termos de Uso.</li>
          <li>Uso da Plataforma para envio de spam, conteúdo ilegal ou práticas abusivas.</li>
          <li>Inadimplência no pagamento do plano contratado.</li>
          <li>Compartilhamento de credenciais com terceiros.</li>
        </ul>
        <p>O Usuário pode cancelar sua conta a qualquer momento, sem fidelidade. Após o cancelamento, os dados serão mantidos por 30 dias antes da exclusão definitiva.</p>
      </>
    ),
  },
  {
    id: 'modificacoes',
    title: 'Modificações dos Termos',
    icon: RefreshCw,
    content: (
      <p>A SIX AI reserva-se o direito de alterar estes Termos a qualquer momento. As alterações serão comunicadas através da Plataforma ou por e-mail. O uso continuado após a notificação constitui aceitação dos novos termos.</p>
    ),
  },
  {
    id: 'lei-aplicavel',
    title: 'Lei Aplicável e Foro',
    icon: Scale,
    content: (
      <>
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil.</p>
        <p>Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
      </>
    ),
  },
  {
    id: 'contato',
    title: 'Contato',
    icon: Mail,
    content: (
      <>
        <p>Para dúvidas, solicitações ou comunicações relacionadas a estes Termos, entre em contato:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">E-mail:</strong> contato@xcompanytech.com</li>
          <li><strong className="text-foreground">Plataforma:</strong> através do módulo de Suporte dentro do painel SIX AI</li>
        </ul>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      icon={FileText}
      lastUpdated="13 de março de 2026"
      sections={sections}
    />
  );
}
