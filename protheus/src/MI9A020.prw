#Include "Protheus.ch"
#Include "FWMVCDef.ch"

/*/{Protheus.doc} MI9A020
Projetos (ZM3) com cronograma (ZM4), recursos de cada atividade (ZM5) e registro operacional - RAID (ZM8).
- status e % da atividade andam juntos (U_MI9COER): concluída = 100%; 100% = concluída; % > 0 = em andamento;
- horas realizadas vêm dos apontamentos (MI9A030) e não são digitadas aqui;
- atividade, atribuição ou projeto com horas apontadas não podem ser excluídos.
@author MAIS i9
/*/
User Function MI9A020()
	Local oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("ZM3")
	oBrowse:SetDescription("Projetos MAIS i9")
	oBrowse:AddLegend("ZM3_STAEXE == '1'", "GREEN", "Status executivo verde")
	oBrowse:AddLegend("ZM3_STAEXE == '2'", "YELLOW", "Status executivo amarelo")
	oBrowse:AddLegend("ZM3_STAEXE == '3'", "RED", "Status executivo vermelho")
	oBrowse:AddLegend("Empty(ZM3_STAEXE)", "WHITE", "Sem status executivo")
	oBrowse:Activate()
Return Nil

Static Function MenuDef()
	Local aRotina := {}
	ADD OPTION aRotina TITLE "Pesquisar" ACTION "PesqBrw" OPERATION 1 ACCESS 0
	ADD OPTION aRotina TITLE "Visualizar" ACTION "VIEWDEF.MI9A020" OPERATION 2 ACCESS 0
	ADD OPTION aRotina TITLE "Incluir" ACTION "VIEWDEF.MI9A020" OPERATION 3 ACCESS 0
	ADD OPTION aRotina TITLE "Alterar" ACTION "VIEWDEF.MI9A020" OPERATION 4 ACCESS 0
	ADD OPTION aRotina TITLE "Excluir" ACTION "VIEWDEF.MI9A020" OPERATION 5 ACCESS 0
	ADD OPTION aRotina TITLE "Indicadores" ACTION "U_MI9A020I" OPERATION 2 ACCESS 0
	ADD OPTION aRotina TITLE "Relatório do portfólio" ACTION "U_MI9R020" OPERATION 2 ACCESS 0
Return aRotina

Static Function ModelDef()
	Local oStrZM3 := FWFormStruct(1, "ZM3")
	Local oStrZM4 := FWFormStruct(1, "ZM4")
	Local oStrZM5 := FWFormStruct(1, "ZM5")
	Local oStrZM8 := FWFormStruct(1, "ZM8")
	Local oModel := MPFormModel():New("MI9A020M", , {|oMdl| TudoOk(oMdl)})
	Local aGat := {}

	// Status e % sempre coerentes (mesma regra do app).
	aGat := FwStruTrigger("ZM4_PERC", "ZM4_STATUS", "U_MI9COER(FwFldGet('ZM4_STATUS'), FwFldGet('ZM4_PERC'))[1]", .F.)
	oStrZM4:AddTrigger(aGat[1], aGat[2], aGat[3], aGat[4])
	aGat := FwStruTrigger("ZM4_STATUS", "ZM4_PERC", "U_MI9COER(FwFldGet('ZM4_STATUS'), FwFldGet('ZM4_PERC'))[2]", .F.)
	oStrZM4:AddTrigger(aGat[1], aGat[2], aGat[3], aGat[4])

	oModel:AddFields("ZM3MASTER", , oStrZM3)
	oModel:AddGrid("ZM4DETAIL", "ZM3MASTER", oStrZM4, {|oGrid, nLin, cAcao| PreZM4(oGrid, nLin, cAcao)}, {|oGrid| LinhaZM4(oGrid)})
	oModel:AddGrid("ZM5DETAIL", "ZM4DETAIL", oStrZM5, {|oGrid, nLin, cAcao| PreZM5(oGrid, nLin, cAcao)})
	oModel:AddGrid("ZM8DETAIL", "ZM3MASTER", oStrZM8, , {|oGrid| LinhaZM8(oGrid)})

	oModel:SetRelation("ZM4DETAIL", {{"ZM4_FILIAL", "xFilial('ZM4')"}, {"ZM4_PROJET", "ZM3_COD"}}, ZM4->(IndexKey(1)))
	oModel:SetRelation("ZM5DETAIL", {{"ZM5_FILIAL", "xFilial('ZM5')"}, {"ZM5_PROJET", "ZM4_PROJET"}, {"ZM5_ATIVID", "ZM4_ITEM"}}, ZM5->(IndexKey(1)))
	oModel:SetRelation("ZM8DETAIL", {{"ZM8_FILIAL", "xFilial('ZM8')"}, {"ZM8_PROJET", "ZM3_COD"}}, ZM8->(IndexKey(1)))

	oModel:GetModel("ZM4DETAIL"):SetUniqueLine({"ZM4_ITEM"})
	oModel:GetModel("ZM5DETAIL"):SetUniqueLine({"ZM5_RECURS"})
	oModel:GetModel("ZM8DETAIL"):SetUniqueLine({"ZM8_ITEM"})
	oModel:GetModel("ZM4DETAIL"):SetOptional(.T.)
	oModel:GetModel("ZM5DETAIL"):SetOptional(.T.)
	oModel:GetModel("ZM8DETAIL"):SetOptional(.T.)

	oModel:SetPrimaryKey({"ZM3_FILIAL", "ZM3_COD"})
	oModel:SetDescription("Projetos MAIS i9")
	oModel:GetModel("ZM3MASTER"):SetDescription("Projeto")
	oModel:GetModel("ZM4DETAIL"):SetDescription("Cronograma")
	oModel:GetModel("ZM5DETAIL"):SetDescription("Recursos da atividade")
	oModel:GetModel("ZM8DETAIL"):SetDescription("Operacional (RAID)")
Return oModel

Static Function ViewDef()
	Local oModel := FWLoadModel("MI9A020")
	Local oStrZM3 := FWFormStruct(2, "ZM3")
	Local oStrZM4 := FWFormStruct(2, "ZM4")
	Local oStrZM5 := FWFormStruct(2, "ZM5")
	Local oStrZM8 := FWFormStruct(2, "ZM8")
	Local oView := FWFormView():New()

	oStrZM4:RemoveField("ZM4_PROJET")
	oStrZM5:RemoveField("ZM5_PROJET")
	oStrZM5:RemoveField("ZM5_ATIVID")
	oStrZM8:RemoveField("ZM8_PROJET")

	oView:SetModel(oModel)
	oView:AddField("VIEW_ZM3", oStrZM3, "ZM3MASTER")
	oView:AddGrid("VIEW_ZM4", oStrZM4, "ZM4DETAIL")
	oView:AddGrid("VIEW_ZM5", oStrZM5, "ZM5DETAIL")
	oView:AddGrid("VIEW_ZM8", oStrZM8, "ZM8DETAIL")

	oView:CreateHorizontalBox("CABEC", 35)
	oView:CreateHorizontalBox("ABAS", 65)
	oView:CreateFolder("PASTAS", "ABAS")
	oView:AddSheet("PASTAS", "ABA_CRONO", "Cronograma")
	oView:AddSheet("PASTAS", "ABA_OPER", "Operacional (RAID)")
	oView:CreateHorizontalBox("BOX_ZM4", 60, , , "PASTAS", "ABA_CRONO")
	oView:CreateHorizontalBox("BOX_ZM5", 40, , , "PASTAS", "ABA_CRONO")
	oView:CreateHorizontalBox("BOX_ZM8", 100, , , "PASTAS", "ABA_OPER")

	oView:SetOwnerView("VIEW_ZM3", "CABEC")
	oView:SetOwnerView("VIEW_ZM4", "BOX_ZM4")
	oView:SetOwnerView("VIEW_ZM5", "BOX_ZM5")
	oView:SetOwnerView("VIEW_ZM8", "BOX_ZM8")
	oView:EnableTitleView("VIEW_ZM5", "Recursos da atividade selecionada (esforço previsto e horas apontadas)")
	oView:AddIncrementField("VIEW_ZM4", "ZM4_ITEM")
	oView:AddIncrementField("VIEW_ZM8", "ZM8_ITEM")
Return oView

/*/ Atividade com horas apontadas não pode ser excluída. /*/
Static Function PreZM4(oGrid, nLin, cAcao)
	If cAcao == "DELETE" .And. TemHoras(oGrid:GetValue("ZM4_PROJET"), oGrid:GetValue("ZM4_ITEM"), "")
		Help(, , "MI9A020", , "A atividade tem horas apontadas. Cancele a atividade em vez de excluir.", 1, 0)
		Return .F.
	EndIf
Return .T.

/*/ Atribuição com horas apontadas não pode ser excluída. /*/
Static Function PreZM5(oGrid, nLin, cAcao)
	If cAcao == "DELETE" .And. oGrid:GetValue("ZM5_REALIZ") > 0
		Help(, , "MI9A020", , "O recurso já apontou horas nesta atividade e não pode ser removido.", 1, 0)
		Return .F.
	EndIf
Return .T.

Static Function LinhaZM4(oGrid)
	Local dIni := oGrid:GetValue("ZM4_INICIO")
	Local dFim := oGrid:GetValue("ZM4_FIM")
	If oGrid:IsDeleted()
		Return .T.
	EndIf
	If !Empty(dIni) .And. !Empty(dFim) .And. dFim < dIni
		Help(, , "MI9A020", , "O fim previsto é anterior ao início.", 1, 0)
		Return .F.
	EndIf
	If Empty(dIni) <> Empty(dFim)
		Help(, , "MI9A020", , "Informe início e fim (ou nenhum dos dois). Sem datas a atividade não entra na capacidade.", 1, 0)
		Return .F.
	EndIf
Return .T.

Static Function LinhaZM8(oGrid)
	Local nProb := oGrid:GetValue("ZM8_PROB")
	Local nImp := oGrid:GetValue("ZM8_IMPACT")
	If oGrid:IsDeleted()
		Return .T.
	EndIf
	If oGrid:GetValue("ZM8_TIPO") == "5" .And. (Empty(nProb) .Or. Empty(nImp))
		Help(, , "MI9A020", , "Para riscos, informe probabilidade e impacto (1 a 5): a severidade é P x I.", 1, 0)
		Return .F.
	EndIf
Return .T.

Static Function TudoOk(oModel)
	If oModel:GetOperation() == MODEL_OPERATION_DELETE .And. TemHoras(oModel:GetValue("ZM3MASTER", "ZM3_COD"), "", "")
		Help(, , "MI9A020", , "O projeto tem horas apontadas. Cancele o projeto em vez de excluir.", 1, 0)
		Return .F.
	EndIf
Return .T.

/*/ Há apontamentos (ZM6) para o projeto / atividade / recurso informados (vazio = qualquer)? /*/
Static Function TemHoras(cProj, cAtiv, cRec)
	Local aArea := GetArea()
	Local lTem := .F.
	DbSelectArea("ZM6")
	ZM6->(DbSetOrder(3))
	lTem := ZM6->(DbSeek(xFilial("ZM6") + cProj + AllTrim(cAtiv) + AllTrim(cRec)))
	RestArea(aArea)
Return lTem

/*/{Protheus.doc} MI9A020I
Indicadores do projeto posicionado e sugestão de status executivo (o GP decide se aplica).
/*/
User Function MI9A020I()
	Local aInd := U_MI9INDP(ZM3->ZM3_COD, dDataBase)
	Local aCor := {"Verde", "Amarelo", "Vermelho"}
	Local cMsg := ""
	cMsg := AllTrim(ZM3->ZM3_COD) + " - " + AllTrim(ZM3->ZM3_NOME) + CRLF + CRLF
	cMsg += "Conclusão (ponderada pelo esforço): " + Transform(aInd[1], "@E 999.9") + "%" + CRLF
	cMsg += "Atividades: " + cValToChar(aInd[10]) + " de " + cValToChar(aInd[9]) + " concluídas; " + cValToChar(aInd[5]) + " atrasada(s)" + CRLF
	cMsg += "Horas: previstas " + Transform(aInd[2], "@E 99,999.9") + " | realizadas " + Transform(aInd[3], "@E 99,999.9") + ;
		" | forecast " + Transform(aInd[4], "@E 99,999.9") + IIf(aInd[12] > 0, " | vendidas " + Transform(aInd[12], "@E 99,999.9"), "") + CRLF
	cMsg += "Riscos abertos: " + cValToChar(aInd[7]) + " (" + cValToChar(aInd[6]) + " alto/crítico)" + CRLF
	cMsg += "Pendências vencidas: " + cValToChar(aInd[8]) + CRLF + CRLF
	cMsg += "Status executivo sugerido: " + aCor[Val(aInd[11])]
	If ZM3->ZM3_STAEXE <> aInd[11]
		cMsg += CRLF + CRLF + "Aplicar a sugestão ao projeto?"
		If MsgYesNo(cMsg, "Indicadores do projeto")
			RecLock("ZM3", .F.)
			ZM3->ZM3_STAEXE := aInd[11]
			ZM3->(MsUnlock())
		EndIf
	Else
		MsgInfo(cMsg, "Indicadores do projeto")
	EndIf
Return Nil
