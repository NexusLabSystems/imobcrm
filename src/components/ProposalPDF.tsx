import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b', padding: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logo: { width: 60, height: 60, objectFit: 'contain' },
  companyBlock: { flex: 1, paddingLeft: 12 },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  companyDoc: { fontSize: 9, color: '#64748b', marginTop: 2 },
  proposalRef: { textAlign: 'right' },
  proposalTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  proposalDate: { fontSize: 9, color: '#64748b', marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginVertical: 14 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1B3A5C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: '#64748b', fontSize: 9 },
  value: { flex: 1, color: '#0f172a' },
  valueBold: { flex: 1, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  badge: { backgroundColor: '#f1f5f9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 9, alignSelf: 'flex-start' },
  approvalRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  approvalDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  approvalDotText: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  approvalInfo: { flex: 1 },
  approvalName: { fontFamily: 'Helvetica-Bold' },
  approvalMeta: { color: '#64748b', fontSize: 9, marginTop: 1 },
  notes: { backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, color: '#475569' },
  signatureSection: { marginTop: 32 },
  signatureRow: { flexDirection: 'row', gap: 24 },
  signatureBox: { flex: 1, borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 6 },
  signatureLabel: { fontSize: 9, color: '#64748b', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#94a3b8' },
})

type Approval = {
  level: number
  action: string
  note: string | null
  createdAt: Date
  user: { name: string }
}

type ProposalData = {
  id: string
  proposedValue: number
  downPayment: number | null
  installments: number | null
  financingType: string | null
  notes: string | null
  status: string
  approvalLevel: number
  createdAt: Date
  enterprise: { name: string }
  unit: { identifier: string; typology: string | null; floor: number | null; areaPrivate: number | null; bedrooms: number | null }
  lead: { name: string } | null
  approvals: Approval[]
  tenant: { name: string; document: string | null; logoUrl: string | null }
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', pending_approval: 'Aguardando aprovação',
  approved: 'Aprovada', rejected: 'Rejeitada', expired: 'Expirada', converted: 'Convertida',
}

const FINANCING_LABEL: Record<string, string> = {
  caixa: 'Caixa Econômica', bancario: 'Financiamento bancário',
  direto: 'Direto com construtora', consorcio: 'Consórcio',
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function ProposalPDF({ proposal }: { proposal: ProposalData }) {
  const approvedApprovals = proposal.approvals.filter((a) => a.action === 'approved')

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
            {proposal.tenant.logoUrl && (
              <Image src={proposal.tenant.logoUrl} style={styles.logo} />
            )}
            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>{proposal.tenant.name}</Text>
              {proposal.tenant.document && (
                <Text style={styles.companyDoc}>CNPJ: {proposal.tenant.document}</Text>
              )}
            </View>
          </View>
          <View style={styles.proposalRef}>
            <Text style={styles.proposalTitle}>PROPOSTA DE COMPRA</Text>
            <Text style={styles.proposalDate}>Emitida em: {fmtDate(proposal.createdAt)}</Text>
            <Text style={[styles.proposalDate, { marginTop: 4 }]}>
              Status: {STATUS_LABEL[proposal.status] ?? proposal.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Lead/Cliente */}
        {proposal.lead && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interessado</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nome</Text>
              <Text style={styles.valueBold}>{proposal.lead.name}</Text>
            </View>
          </View>
        )}

        {/* Imóvel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imóvel</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Empreendimento</Text>
            <Text style={styles.valueBold}>{proposal.enterprise.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Unidade</Text>
            <Text style={styles.value}>{proposal.unit.identifier}</Text>
          </View>
          {proposal.unit.typology && (
            <View style={styles.row}>
              <Text style={styles.label}>Tipologia</Text>
              <Text style={styles.value}>{proposal.unit.typology}</Text>
            </View>
          )}
          {proposal.unit.floor != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Andar</Text>
              <Text style={styles.value}>{proposal.unit.floor}º</Text>
            </View>
          )}
          {proposal.unit.bedrooms != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Dormitórios</Text>
              <Text style={styles.value}>{proposal.unit.bedrooms}</Text>
            </View>
          )}
          {proposal.unit.areaPrivate != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Área privativa</Text>
              <Text style={styles.value}>{proposal.unit.areaPrivate} m²</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Dados financeiros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Financeiros</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Valor proposto</Text>
            <Text style={styles.valueBold}>{fmt(proposal.proposedValue)}</Text>
          </View>
          {proposal.downPayment != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Entrada</Text>
              <Text style={styles.value}>{fmt(proposal.downPayment)}</Text>
            </View>
          )}
          {proposal.installments != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Parcelas</Text>
              <Text style={styles.value}>{proposal.installments}x</Text>
            </View>
          )}
          {proposal.financingType && (
            <View style={styles.row}>
              <Text style={styles.label}>Financiamento</Text>
              <Text style={styles.value}>{FINANCING_LABEL[proposal.financingType] ?? proposal.financingType}</Text>
            </View>
          )}
        </View>

        {/* Observações */}
        {proposal.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.notes}>{proposal.notes}</Text>
          </View>
        )}

        {/* Histórico de aprovações */}
        {approvedApprovals.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aprovações</Text>
              {approvedApprovals.map((a, i) => (
                <View key={i} style={styles.approvalRow}>
                  <View style={styles.approvalDot}>
                    <Text style={styles.approvalDotText}>✓</Text>
                  </View>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>
                      {a.user.name} — Nível {a.level}
                    </Text>
                    {a.note && <Text style={styles.approvalMeta}>{a.note}</Text>}
                    <Text style={styles.approvalMeta}>{fmtDateTime(a.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Assinaturas */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Interessado(a)</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Corretor(a) Responsável</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>{proposal.tenant.name}</Text>
            </View>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{proposal.tenant.name} — Proposta gerada pelo ImobCRM</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
