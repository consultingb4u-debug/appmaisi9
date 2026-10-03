#Include "Protheus.ch"
#Include "FWMVCDef.ch"

/*/{Protheus.doc} MI9A040
Alocações avulsas por semana (ZM7): horas de um recurso num projeto que não estão no cronograma
(suporte, sustentação, reuniões). Somam-se ao rateio do cronograma na capacidade.
@author MAIS i9
/*/
User Function MI9A040()
	Local oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("ZM7")
	oBrowse:SetDescription("Alocações avulsas por semana")
	oBrowse:Activate()
Return Nil

Static Function MenuDef()
Return FWMVCMenu("MI9A040")

Static Function ModelDef()
	Local oModel := MPFormModel():New("MI9A040M")
	oModel:AddFields("ZM7MASTER", , FWFormStruct(1, "ZM7"))
	oModel:SetPrimaryKey({"ZM7_FILIAL", "ZM7_ID"})
	oModel:SetDescription("Alocação avulsa")
Return oModel

Static Function ViewDef()
	Local oView := FWFormView():New()
	oView:SetModel(FWLoadModel("MI9A040"))
	oView:AddField("VIEW_ZM7", FWFormStruct(2, "ZM7"), "ZM7MASTER")
	oView:CreateHorizontalBox("TELA", 100)
	oView:SetOwnerView("VIEW_ZM7", "TELA")
Return oView

/*/{Protheus.doc} MI9A050
Feriados da gestão de projetos (ZM9). Os nacionais são calculados automaticamente (U_MI9FER):
aqui se cadastram feriados locais/adicionais (tipo 1) e nacionais a desconsiderar, como pontos facultativos (tipo 2).
/*/
User Function MI9A050()
	AxCadastro("ZM9", "Feriados (adicionais e desconsiderados)")
Return Nil
