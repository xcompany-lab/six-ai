import {
  ShieldCheck, ClipboardList, Database, Share2, HardDrive,
  Lock, UserCheck, Cookie, RefreshCw, Mail
} from 'lucide-react';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

const sections: LegalSection[] = [
  {
    id: 'introducao',
    title: 'Introdução',
    icon: ShieldCheck,
    content: (
      <>
        <p>A X-Company Tech AI, desenvolvedora da plataforma SIX AI, está comprometida com a proteção da privacidade e dos dados pessoais de seus Usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
        <p>Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos os dados pessoais tratados pela Plataforma.</p>
      </>
    ),
  },
  {
    id: 'dados-coletados',
    title: 'Dados Coletados',
    icon: ClipboardList,
    content: (
      <>
        <p>Coletamos e tratamos os seguintes tipos de dados:</p>
        <h3 className="text-foreground font-semibold mt-4 mb-2">Dados de Cadastro</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nome completo e e-mail</li>
          <li>Número de WhatsApp</li>
          <li>Senha (armazenada de forma criptografada)</li>
        </ul>
        <h3 className="text-foreground font-semibold mt-4 mb-2">Dados do Perfil Empresarial</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nome do negócio, nicho/segmento</li>
          <li>Serviços oferecidos, horários de funcionamento</li>
          <li>Tom de voz e descrição do negócio</li>
          <li>FAQ, objeções e base de conhecimento (para configuração da IA)</li>
        </ul>
        <h3 className="text-foreground font-semibold mt-4 mb-2">Dados de Uso da Plataforma</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Leads e contatos comerciais cadastrados</li>
          <li>Histórico de agendamentos e status</li>
          <li>Configurações de follow-up e campanhas</li>
          <li>Métricas de uso e performance</li>
        </ul>
        <h3 className="text-foreground font-semibold mt-4 mb-2">Dados de Integração WhatsApp</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Mensagens enviadas e recebidas via WhatsApp (processadas pela IA)</li>
          <li>Dados de instância WhatsApp (via Evolution API)</li>
          <li>Memória de contato: resumo de interações, sentimento e preferências</li>
        </ul>
      </>
    ),
  },
  {
    id: 'uso-dados',
    title: 'Uso dos Dados',
    icon: Database,
    content: (
      <>
        <p>Os dados coletados são utilizados para:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-foreground">Operação da Plataforma:</strong> fornecer e manter as funcionalidades contratadas (CRM, Atendente IA, agendamentos, follow-up, campanhas).</li>
          <li><strong className="text-foreground">Personalização da IA:</strong> treinar e configurar o Atendente IA de acordo com o perfil empresarial do Usuário.</li>
          <li><strong className="text-foreground">Análises e Insights:</strong> gerar relatórios de performance, métricas de conversão e análise de sentimento.</li>
          <li><strong className="text-foreground">Comunicação:</strong> enviar notificações sobre a conta, atualizações da Plataforma e suporte técnico.</li>
          <li><strong className="text-foreground">Melhoria contínua:</strong> aprimorar as funcionalidades e a experiência do Usuário.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'compartilhamento',
    title: 'Compartilhamento de Dados',
    icon: Share2,
    content: (
      <>
        <p>Seus dados podem ser compartilhados com:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-foreground">Provedores de infraestrutura:</strong> Supabase (banco de dados e autenticação), hospedados em conformidade com padrões internacionais de segurança.</li>
          <li><strong className="text-foreground">Provedores de IA:</strong> Google (Gemini) para processamento de linguagem natural. Apenas o conteúdo necessário é enviado para geração de respostas.</li>
          <li><strong className="text-foreground">Integrações:</strong> Evolution API (WhatsApp) e Google Calendar, conforme configurado pelo Usuário.</li>
          <li><strong className="text-foreground">Obrigações legais:</strong> quando exigido por lei, ordem judicial ou autoridade competente.</li>
        </ul>
        <p>Não vendemos, alugamos ou comercializamos dados pessoais de nossos Usuários a terceiros.</p>
      </>
    ),
  },
  {
    id: 'armazenamento',
    title: 'Armazenamento e Retenção',
    icon: HardDrive,
    content: (
      <>
        <p>Os dados são armazenados em infraestrutura segura da Supabase, com as seguintes medidas:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Banco de dados PostgreSQL com Row Level Security (RLS) habilitado em todas as tabelas.</li>
          <li>Criptografia em trânsito (TLS/SSL) e em repouso.</li>
          <li>Isolamento de dados por Usuário — cada Usuário acessa apenas seus próprios dados.</li>
          <li>Backups automáticos diários.</li>
        </ul>
        <p>Os dados são mantidos enquanto a conta estiver ativa. Após cancelamento, os dados são retidos por 30 dias para possível reativação e depois excluídos permanentemente.</p>
      </>
    ),
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    icon: Lock,
    content: (
      <>
        <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Autenticação segura via Supabase Auth com suporte a recuperação de senha.</li>
          <li>Políticas de Row Level Security (RLS) que garantem isolamento de dados entre Usuários.</li>
          <li>Controle de acesso baseado em roles (admin, moderator, user).</li>
          <li>Monitoramento e logs de acesso às Edge Functions.</li>
          <li>Chaves de API e tokens armazenados como variáveis de ambiente seguras (secrets).</li>
        </ul>
      </>
    ),
  },
  {
    id: 'direitos-usuario',
    title: 'Direitos do Usuário (LGPD)',
    icon: UserCheck,
    content: (
      <>
        <p>Em conformidade com a LGPD, o Usuário tem direito a:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-foreground">Acesso:</strong> solicitar informações sobre quais dados pessoais são tratados.</li>
          <li><strong className="text-foreground">Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
          <li><strong className="text-foreground">Exclusão:</strong> solicitar a eliminação dos dados pessoais tratados.</li>
          <li><strong className="text-foreground">Portabilidade:</strong> solicitar a transferência dos dados a outro fornecedor.</li>
          <li><strong className="text-foreground">Revogação do consentimento:</strong> retirar o consentimento a qualquer momento.</li>
          <li><strong className="text-foreground">Informação:</strong> ser informado sobre as entidades com as quais os dados são compartilhados.</li>
        </ul>
        <p>Para exercer seus direitos, entre em contato pelo e-mail <span className="text-foreground">contato@xcompanytech.com</span> ou através do módulo de Suporte na Plataforma.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies e Tecnologias',
    icon: Cookie,
    content: (
      <>
        <p>A Plataforma utiliza cookies e tecnologias similares para:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-foreground">Cookies essenciais:</strong> manter a sessão de autenticação do Usuário (Supabase Auth).</li>
          <li><strong className="text-foreground">Armazenamento local:</strong> preferências de interface (tema, estado do sidebar).</li>
        </ul>
        <p>Não utilizamos cookies de rastreamento ou publicidade de terceiros.</p>
      </>
    ),
  },
  {
    id: 'alteracoes',
    title: 'Alterações nesta Política',
    icon: RefreshCw,
    content: (
      <p>Esta Política de Privacidade pode ser atualizada periodicamente. As alterações serão comunicadas através da Plataforma e/ou por e-mail. Recomendamos a revisão periódica desta página.</p>
    ),
  },
  {
    id: 'contato',
    title: 'Contato',
    icon: Mail,
    content: (
      <>
        <p>Para questões relacionadas à privacidade e proteção de dados:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Controlador:</strong> X-Company Tech AI</li>
          <li><strong className="text-foreground">E-mail:</strong> contato@xcompanytech.com</li>
          <li><strong className="text-foreground">Plataforma:</strong> módulo de Suporte no painel SIX AI</li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      icon={ShieldCheck}
      lastUpdated="13 de março de 2026"
      sections={sections}
    />
  );
}
