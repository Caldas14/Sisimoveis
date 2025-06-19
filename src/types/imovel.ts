export type TipoImovel = 
  | 'Residencial'
  | 'Comercial'
  | 'Industrial'
  | 'Rural'
  | 'Terreno'
  | 'Outros';

export type StatusTransferencia = 
  | 'Não transferido'
  | 'Em processo'
  | 'Transferido'
  | 'Cancelado';

export type Finalidade =
  | 'Habitação'
  | 'Comércio'
  | 'Indústria'
  | 'Agricultura'
  | 'Serviços'
  | 'Misto'
  | 'Outros';

export type TipoPosse =
  | 'Proprietário'
  | 'Locatário'
  | 'Comodato'
  | 'Outros';

export type TipoUsoEdificacao =
  | 'Residencial Unifamiliar'
  | 'Residencial Multifamiliar'
  | 'Comercial'
  | 'Industrial'
  | 'Misto'
  | 'Terreno sem edificação'
  | 'Outros';

export interface Infraestrutura {
  agua: boolean;
  esgoto: boolean;
  energia: boolean;
  pavimentacao: boolean;
  iluminacao: boolean;
  coletaLixo: boolean;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  url: string;
  dataUpload: string;
  tamanho: number;
}

export interface Imovel {
  id: string;
  matricula: string;
  localizacao: string;
  area: number;
  areaDesmembrada: number;
  areaRemanescente: number;
  percentualDesmembrado: number;
  objeto: string;
  matriculasOriginadas: string;
  observacao: string;
  finalidade: Finalidade;
  tipoImovel: TipoImovel;
  statusTransferencia: StatusTransferencia;
  documentos: Documento[];
  imovelPaiId: string | null;
  dataCadastro: string;
  dataAtualizacao: string;
  // Campos adicionais
  infraestrutura: Infraestrutura;
  valorVenal: number;
  registroIPTU: string;
  latitude: number;
  longitude: number;
  tipoUsoEdificacao: TipoUsoEdificacao;
  tipoPosse: TipoPosse;
  pontoReferencia: string;
  // Campos de assinatura de usuário
  usuarioCadastroId: string;
  usuarioCadastroNome: string;
}

export interface ImovelFormData {
  matricula: string;
  localizacao: string;
  area: number | string; // Permitir string para formatação com vírgula
  objeto: string;
  matriculasOriginadas: string;
  observacao: string;
  finalidade: Finalidade;
  tipoImovel: TipoImovel;
  statusTransferencia: StatusTransferencia;
  imovelPaiId: string | null;
  // Campos adicionais
  infraestrutura: Infraestrutura;
  valorVenal: number;
  registroIPTU: string;
  latitude: number;
  longitude: number;
  tipoUsoEdificacao: TipoUsoEdificacao;
  tipoPosse: TipoPosse;
  pontoReferencia: string;
  // Campos de assinatura de usuário
  usuarioCadastroId?: string;
  usuarioCadastroNome?: string;
}