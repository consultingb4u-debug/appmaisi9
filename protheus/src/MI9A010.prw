#Include "Protheus.ch"
#Include "FWMVCDef.ch"

/*/{Protheus.doc} MI9A010
Cadastro de recursos (ZM1) com as indisponibilidades (ZM2): férias, ausências, treinamentos, feriados locais.
Indisponibilidade aprovada reduz a capacidade líquida e tira os dias do rateio do cronograma.
Só gestores (U_MI9GEST) mudam a situação; os demais registram como pendente.
@author MAIS i9
/*/
User Function MI9A010()
	Local oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("ZM1")
	oBrowse:SetDescription("Recursos MAIS i9")
	oBrowse:AddLegend("ZM1_ATIVO == '1'", "GREEN", "Ativo")
	oBrowse:AddLegend("ZM1_ATIVO <> '1'", "GRAY", "Inativo")
	oBrowse:Activate()
Return Nil

Static Function MenuDef()
	Local aRotina := {}
	ADD OPTION aRotina TITLE "Pesquisar" ACTION "PesqBrw" OPERATION 1 ACCESS 0
	ADD OPTION aRotina TITLE "Visualizar" ACTION "VIEWDEF.MI9A010" OPERATION 2 ACCESS 0
	ADD OPTION aRotina TITLE "Incluir" ACTION "VIEWDEF.MI9A010" OPERATION 3 ACCESS 0
	ADD OPTION aRotina TITLE "Alterar" ACTION "VIEWDEF.MI9A010" OPERATION 4 ACCESS 0
	ADD OPTION aRotina TITLE "Excluir" ACTION "VIEWDEF.MI9A010" OPERATION 5 ACCESS 0
	ADD OPTION aRotina TITLE "Aprovar indisponibilidades" ACTION "U_MI9A010A" OPERATION 4 ACCESS 0
Return aRotina

Static Function ModelDef()
	Local oStrZM1 := FWFormStruct(1, "ZM1")
	Local oStrZM2 := FWFormStruct(1, "ZM2")
	Local oModel := MPFormModel():New("MI9A010M", , {|oMdl| TudoOk(oMdl)})

	oModel:AddFields("ZM1MASTER", , oStrZM1)
	oModel:AddGrid("ZM2DETAIL", "ZM1MASTER", oStrZM2, , {|oGrid| LinhaOk(oGrid)})
	oModel:SetRelation("ZM2DETAIL", {{"ZM2_FILIAL", "xFilial('ZM2')"}, {"ZM2_RECURS", "ZM1_COD"}}, ZM2->(IndexKey(1)))
	oModel:GetModel("ZM2DETAIL"):SetUniqueLine({"ZM2_ITEM"})
	oModel:GetModel("ZM2DETAIL"):SetOptional(.T.)
	oModel:SetPrimaryKey({"ZM1_FILIAL", "ZM1_COD"})
	oModel:SetDescription("Recursos MAIS i9")
	oModel:GetModel("ZM1MASTER"):SetDescription("Recurso")
	oModel:GetModel("ZM2DETAIL"):SetDescription("Indisponibilidades")
Return oModel

Static Function ViewDef()
	Local oModel := FWLoadModel("MI9A010")
	Local oStrZM1 := FWFormStruct(2, "ZM1")
	Local oStrZM2 := FWFormStruct(2, "ZM2")
	Local oView := FWFormView():New()

	oStrZM2:RemoveField("ZM2_RECURS")
	oView:SetModel(oModel)
	oView:AddField("VIEW_ZM1", oStrZM1, "ZM1MASTER")
	oView:AddGrid("VIEW_ZM2", oStrZM2, "ZM2DETAIL")
	oView:CreateHorizontalBox("SUPERIOR", 45)
	oView:CreateHorizontalBox("INFERIOR", 55)
	oView:SetOwnerView("VIEW_ZM1", "SUPERIOR")
	oView:SetOwnerView("VIEW_ZM2", "INFERIOR")
	oView:EnableTitleView("VIEW_ZM2", "Indisponibilidades (férias, ausências, treinamentos)")
	oView:AddIncrementField("VIEW_ZM2", "ZM2_ITEM")
Return oView

/*/ Fim não pode ser anterior ao início. (A situação só é editável por gestores: X3_WHEN = U_MI9GEST().) /*/
Static Function LinhaOk(oGrid)
	If oGrid:IsDeleted()
		Return .T.
	EndIf
	If oGrid:GetValue("ZM2_FIM") < oGrid:GetValue("ZM2_INICIO")
		Help(, , "MI9A010", , "O fim da indisponibilidade é anterior ao início.", 1, 0)
		Return .F.
	EndIf
Return .T.

/*/ Recurso com apontamentos ou atribuições não pode ser excluído (inative-o). /*/
Static Function TudoOk(oModel)
	Local cRec := oModel:GetValue("ZM1MASTER", "ZM1_COD")
	If oModel:GetOperation() == MODEL_OPERATION_DELETE
		ZM5->(DbSetOrder(2))
		If ZM5->(DbSeek(xFilial("ZM5") + cRec))
			Help(, , "MI9A010", , "O recurso tem atividades atribuídas. Em vez de excluir, marque como inativo.", 1, 0)
			Return .F.
		EndIf
		ZM6->(DbSetOrder(2))
		If ZM6->(DbSeek(xFilial("ZM6") + cRec))
			Help(, , "MI9A010", , "O recurso tem horas apontadas. Em vez de excluir, marque como inativo.", 1, 0)
			Return .F.
		EndIf
	EndIf
Return .T.

/*/{Protheus.doc} MI9A010A
Aprova de uma vez as indisponibilidades pendentes do recurso posicionado (somente gestores).
/*/
User Function MI9A010A()
	Local aArea := GetArea()
	Local cRec := ZM1->ZM1_COD
	Local nQtd := 0
	If !U_MI9GEST()
		MsgStop("Somente gestores aprovam indisponibilidades.", "MAIS i9")
		Return Nil
	EndIf
	DbSelectArea("ZM2")
	ZM2->(DbSetOrder(1))
	ZM2->(DbSeek(xFilial("ZM2") + cRec))
	While !ZM2->(Eof()) .And. ZM2->ZM2_FILIAL == xFilial("ZM2") .And. ZM2->ZM2_RECURS == cRec
		If ZM2->ZM2_STATUS == "1"
			nQtd++
		EndIf
		ZM2->(DbSkip())
	EndDo
	If nQtd == 0
		MsgInfo("Não há indisponibilidades pendentes para " + AllTrim(ZM1->ZM1_NOME) + ".", "MAIS i9")
	ElseIf MsgYesNo("Aprovar " + cValToChar(nQtd) + " indisponibilidade(s) pendente(s) de " + AllTrim(ZM1->ZM1_NOME) + "?", "MAIS i9")
		Begin Transaction
			ZM2->(DbSeek(xFilial("ZM2") + cRec))
			While !ZM2->(Eof()) .And. ZM2->ZM2_FILIAL == xFilial("ZM2") .And. ZM2->ZM2_RECURS == cRec
				If ZM2->ZM2_STATUS == "1"
					RecLock("ZM2", .F.)
					ZM2->ZM2_STATUS := "2"
					ZM2->(MsUnlock())
				EndIf
				ZM2->(DbSkip())
			EndDo
		End Transaction
		MsgInfo("Indisponibilidades aprovadas. A capacidade já considera as ausências.", "MAIS i9")
	EndIf
	RestArea(aArea)
Return Nil
