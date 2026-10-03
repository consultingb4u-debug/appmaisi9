#Include "Protheus.ch"

/*/{Protheus.doc} MI9R010
Capacidade por semana: para cada recurso ativo, horas planejadas x capacidade líquida e a faixa de utilização
(D=disponível <50%, Q=adequado, A=atenção >=85%, S=sobrecarregado >100%).
Carga = rateio do cronograma da semana atual em diante + alocações avulsas. Exporta para Excel pelo próprio TReport.
@author MAIS i9
/*/
User Function MI9R010()
	Local aPar := {}
	Local aRet := {}
	Local aSem := {}
	Local oReport
	aAdd(aPar, {1, "Semana inicial (AAAA-Wnn)", U_MI9SEM(dDataBase)[1], "@!", "U_MI9SEMV(MV_PAR01)", "", "", 50, .T.})
	aAdd(aPar, {1, "Quantidade de semanas", 8, "99", "MV_PAR02 >= 1 .And. MV_PAR02 <= 26", "", "", 20, .T.})
	aAdd(aPar, {1, "Área (vazio = todas)", Space(30), "", "", "", "", 80, .F.})
	If !ParamBox(aPar, "Capacidade por semana", @aRet)
		Return Nil
	EndIf
	aSem := U_MI9SEMI(aRet[1])
	aSem := U_MI9SEMS(aSem[4], aSem[4] + 7 * aRet[2] - 1)
	oReport := Definir(aSem, AllTrim(aRet[3]))
	oReport:PrintDialog()
Return Nil

Static Function Definir(aSem, cArea)
	Local oReport := TReport():New("MI9R010", "Capacidade por semana", , {|oRep| Imprimir(oRep, aSem, cArea)}, ;
		"Horas planejadas x capacidade líquida por recurso e semana, com a faixa de utilização.")
	Local oSec
	Local nI := 0
	oReport:SetLandscape()
	oReport:SetTotalInLine(.F.)
	oSec := TRSection():New(oReport, "Recursos", {})
	TRCell():New(oSec, "RECURSO", , "Recurso", "", 28)
	TRCell():New(oSec, "AREA", , "Área", "", 14)
	For nI := 1 To Len(aSem)
		TRCell():New(oSec, "S" + StrZero(nI, 2), , U_MI9ROT(aSem[nI]), "@!", 15)
	Next nI
Return oReport

Static Function Imprimir(oReport, aSem, cArea)
	Local oSec := oReport:Section(1)
	Local aCalc := U_MI9CARG(dDataBase)
	Local aCel := {}
	Local cAli := GetNextAlias()
	Local cSql := ""
	Local nI := 0
	Local nSobre := 0

	cSql := "SELECT ZM1_COD, ZM1_NOME, ZM1_AREA, ZM1_HSEM FROM " + RetSqlName("ZM1") + ;
		" WHERE ZM1_FILIAL = '" + xFilial("ZM1") + "' AND D_E_L_E_T_ = ' ' AND ZM1_ATIVO = '1'" + ;
		IIf(Empty(cArea), "", " AND ZM1_AREA = '" + cArea + "'") + " ORDER BY ZM1_NOME"
	DbUseArea(.T., "TOPCONN", TcGenQry(, , ChangeQuery(cSql)), cAli, .F., .T.)
	oReport:SetMeter(0)
	oSec:Init()
	While !(cAli)->(Eof()) .And. !oReport:Cancel()
		oReport:IncMeter()
		oSec:Cell("RECURSO"):SetValue(AllTrim((cAli)->ZM1_NOME))
		oSec:Cell("AREA"):SetValue(AllTrim((cAli)->ZM1_AREA))
		For nI := 1 To Len(aSem)
			aCel := U_MI9CEL(aCalc, (cAli)->ZM1_COD, (cAli)->ZM1_HSEM, .T., aSem[nI])
			oSec:Cell("S" + StrZero(nI, 2)):SetValue(Celula(aCel))
			If aCel[3][1] == "S"
				nSobre++
			EndIf
		Next nI
		oSec:PrintLine()
		(cAli)->(DbSkip())
	EndDo
	oSec:Finish()
	(cAli)->(DbCloseArea())
	oReport:SkipLine()
	oReport:PrintText("Cada célula: horas planejadas / capacidade líquida, utilização e faixa (D disponível, Q adequado, A atenção, S sobrecarregado).")
	oReport:PrintText("Semanas com sobrecarga no período: " + cValToChar(nSobre) + ". Semanas anteriores à atual mostram só alocações avulsas.")
Return Nil

Static Function Celula(aCel)
	If aCel[2] <= 0 .And. aCel[1] <= 0
		Return "-"
	EndIf
	If aCel[2] <= 0
		Return cValToChar(aCel[1]) + "h sem cap. S"
	EndIf
Return cValToChar(aCel[1]) + "/" + cValToChar(aCel[2]) + " " + cValToChar(Round(aCel[1] / aCel[2] * 100, 0)) + "% " + aCel[3][1]
