#Include "Protheus.ch"
#Include "FWMVCDef.ch"

/*/{Protheus.doc} MI9A030
Apontamento de horas (ZM6): cada pessoa lança as horas por atividade em que está atribuída.
Ao gravar, recalcula as horas realizadas da atribuição (ZM5_REALIZ) na mesma transação.
Quem não é gestor vê e lança só as próprias horas.
@author MAIS i9
/*/
User Function MI9A030()
	Local oBrowse := FWMBrowse():New()
	Local cRec := U_MI9MREC()
	If Empty(cRec) .And. !U_MI9GEST()
		MsgStop("Seu usuário não está vinculado a um recurso. Peça a um gestor para preencher o campo Usuário no cadastro de recursos.", "MAIS i9")
		Return Nil
	EndIf
	oBrowse:SetAlias("ZM6")
	oBrowse:SetDescription("Apontamento de horas")
	If !U_MI9GEST()
		oBrowse:SetFilterDefault("ZM6_RECURS == '" + cRec + "'")
	EndIf
	oBrowse:Activate()
Return Nil

Static Function MenuDef()
Return FWMVCMenu("MI9A030")

Static Function ModelDef()
	Local oStrZM6 := FWFormStruct(1, "ZM6")
	Local oModel := MPFormModel():New("MI9A030M", , {|oMdl| TudoOk(oMdl)}, {|oMdl| Grava(oMdl)})
	oModel:AddFields("ZM6MASTER", , oStrZM6)
	oModel:SetPrimaryKey({"ZM6_FILIAL", "ZM6_ID"})
	oModel:SetDescription("Apontamento de horas")
	oModel:GetModel("ZM6MASTER"):SetDescription("Apontamento")
Return oModel

Static Function ViewDef()
	Local oView := FWFormView():New()
	oView:SetModel(FWLoadModel("MI9A030"))
	oView:AddField("VIEW_ZM6", FWFormStruct(2, "ZM6"), "ZM6MASTER")
	oView:CreateHorizontalBox("TELA", 100)
	oView:SetOwnerView("VIEW_ZM6", "TELA")
Return oView

/*/{Protheus.doc} MI9A030V
Validação do campo atividade: o recurso precisa estar atribuído à atividade do projeto, e a atividade não pode estar cancelada.
/*/
User Function MI9A030V()
	Local cProj := FwFldGet("ZM6_PROJET")
	Local cAtiv := FwFldGet("ZM6_ATIVID")
	Local cRec := FwFldGet("ZM6_RECURS")
	Local cSt := Posicione("ZM4", 1, xFilial("ZM4") + cProj + cAtiv, "ZM4_STATUS")
	If Empty(cSt)
		Help(, , "MI9A030V", , "Atividade não encontrada no cronograma do projeto.", 1, 0)
		Return .F.
	EndIf
	If cSt == "5"
		Help(, , "MI9A030V", , "A atividade está cancelada.", 1, 0)
		Return .F.
	EndIf
	ZM5->(DbSetOrder(1))
	If !ZM5->(DbSeek(xFilial("ZM5") + cProj + cAtiv + cRec))
		Help(, , "MI9A030V", , "O recurso não está atribuído a esta atividade. Peça ao GP para incluí-lo no cronograma.", 1, 0)
		Return .F.
	EndIf
Return .T.

/*/ Consultor só altera ou exclui os próprios apontamentos. /*/
Static Function TudoOk(oModel)
	If !U_MI9GEST() .And. oModel:GetValue("ZM6MASTER", "ZM6_RECURS") <> U_MI9MREC()
		Help(, , "MI9A030", , "Você só pode lançar e alterar as suas próprias horas.", 1, 0)
		Return .F.
	EndIf
Return .T.

/*/ Grava e recalcula o realizado da atribuição anterior (se mudou) e da atual. /*/
Static Function Grava(oModel)
	Local nOper := oModel:GetOperation()
	Local aAnt := {}
	Local lOk := .T.
	If nOper <> MODEL_OPERATION_INSERT
		aAnt := {ZM6->ZM6_PROJET, ZM6->ZM6_ATIVID, ZM6->ZM6_RECURS}
	EndIf
	Begin Transaction
		lOk := FWFormCommit(oModel)
		If lOk
			If !Empty(aAnt)
				U_MI9REAL(aAnt[1], aAnt[2], aAnt[3])
			EndIf
			If nOper <> MODEL_OPERATION_DELETE
				U_MI9REAL(oModel:GetValue("ZM6MASTER", "ZM6_PROJET"), oModel:GetValue("ZM6MASTER", "ZM6_ATIVID"), oModel:GetValue("ZM6MASTER", "ZM6_RECURS"))
			EndIf
		Else
			DisarmTransaction()
		EndIf
	End Transaction
Return lOk
