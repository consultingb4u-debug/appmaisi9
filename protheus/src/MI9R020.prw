#Include "Protheus.ch"

/*/{Protheus.doc} MI9R020
Portfólio: projetos com status, conclusão ponderada, horas (previstas, realizadas, forecast, vendidas),
atividades atrasadas, riscos altos, pendências vencidas e o status executivo informado x sugerido.
@author MAIS i9
/*/
User Function MI9R020()
	Local aPar := {}
	Local aRet := {}
	Local oReport
	aAdd(aPar, {4, "Filtro", .T., "Somente projetos ativos (aprovação, andamento, bloqueado)", 160, "", .F.})
	If !ParamBox(aPar, "Portfólio de projetos", @aRet)
		Return Nil
	EndIf
	oReport := Definir(aRet[1])
	oReport:PrintDialog()
Return Nil

Static Function Definir(lAtivos)
	Local oReport := TReport():New("MI9R020", "Portfólio de projetos", , {|oRep| Imprimir(oRep, lAtivos)}, ;
		"Situação dos projetos: conclusão, horas, atrasos, riscos e status executivo.")
	Local oSec
	oReport:SetLandscape()
	oSec := TRSection():New(oReport, "Projetos", {})
	TRCell():New(oSec, "CODIGO", , "Código", "@!", 7)
	TRCell():New(oSec, "CLIENTE", , "Cliente", "", 16)
	TRCell():New(oSec, "PROJETO", , "Projeto", "", 30)
	TRCell():New(oSec, "GP", , "GP", "", 16)
	TRCell():New(oSec, "STATUS", , "Status", "", 16)
	TRCell():New(oSec, "GOLIVE", , "Go-live", "", 10)
	TRCell():New(oSec, "CONCL", , "Concl. %", "@E 999.9", 8)
	TRCell():New(oSec, "PREV", , "Previsto h", "@E 99,999.9", 10)
	TRCell():New(oSec, "REAL", , "Realiz. h", "@E 99,999.9", 10)
	TRCell():New(oSec, "FCST", , "Forecast h", "@E 99,999.9", 10)
	TRCell():New(oSec, "VEND", , "Vendidas h", "@E 99,999.9", 10)
	TRCell():New(oSec, "ATRAS", , "Atrasadas", "@E 999", 9)
	TRCell():New(oSec, "RISCOS", , "Riscos altos", "@E 999", 9)
	TRCell():New(oSec, "PENDV", , "Pend. venc.", "@E 999", 9)
	TRCell():New(oSec, "EXEC", , "Status exec.", "", 9)
	TRCell():New(oSec, "SUGER", , "Sugerido", "", 9)
Return oReport

Static Function Imprimir(oReport, lAtivos)
	Local oSec := oReport:Section(1)
	Local aCor := {"Verde", "Amarelo", "Vermelho"}
	Local aInd := {}
	Local cAli := GetNextAlias()
	Local cSql := ""

	cSql := "SELECT ZM3_COD, ZM3_NOME, ZM3_STATUS, ZM3_STAEXE, ZM3_GOLIVE, ZM3_GP, COALESCE(A1_NREDUZ, ' ') CLIENTE" + ;
		" FROM " + RetSqlName("ZM3") + " ZM3" + ;
		" LEFT JOIN " + RetSqlName("SA1") + " SA1 ON A1_FILIAL = '" + xFilial("SA1") + "' AND A1_COD = ZM3_CLIENT AND A1_LOJA = ZM3_LOJA AND SA1.D_E_L_E_T_ = ' '" + ;
		" WHERE ZM3_FILIAL = '" + xFilial("ZM3") + "' AND ZM3.D_E_L_E_T_ = ' '" + ;
		IIf(lAtivos, " AND ZM3_STATUS IN ('2','4','5')", "") + " ORDER BY CLIENTE, ZM3_NOME"
	DbUseArea(.T., "TOPCONN", TcGenQry(, , ChangeQuery(cSql)), cAli, .F., .T.)
	oReport:SetMeter(0)
	oSec:Init()
	While !(cAli)->(Eof()) .And. !oReport:Cancel()
		oReport:IncMeter()
		aInd := U_MI9INDP((cAli)->ZM3_COD, dDataBase)
		oSec:Cell("CODIGO"):SetValue((cAli)->ZM3_COD)
		oSec:Cell("CLIENTE"):SetValue(AllTrim((cAli)->CLIENTE))
		oSec:Cell("PROJETO"):SetValue(AllTrim((cAli)->ZM3_NOME))
		oSec:Cell("GP"):SetValue(AllTrim(Posicione("ZM1", 1, xFilial("ZM1") + (cAli)->ZM3_GP, "ZM1_NOME")))
		oSec:Cell("STATUS"):SetValue(AllTrim(X3Combo("ZM3_STATUS", (cAli)->ZM3_STATUS)))
		oSec:Cell("GOLIVE"):SetValue(DToC(SToD((cAli)->ZM3_GOLIVE)))
		oSec:Cell("CONCL"):SetValue(aInd[1])
		oSec:Cell("PREV"):SetValue(aInd[2])
		oSec:Cell("REAL"):SetValue(aInd[3])
		oSec:Cell("FCST"):SetValue(aInd[4])
		oSec:Cell("VEND"):SetValue(aInd[12])
		oSec:Cell("ATRAS"):SetValue(aInd[5])
		oSec:Cell("RISCOS"):SetValue(aInd[6])
		oSec:Cell("PENDV"):SetValue(aInd[8])
		oSec:Cell("EXEC"):SetValue(IIf(Empty((cAli)->ZM3_STAEXE), "-", aCor[Val((cAli)->ZM3_STAEXE)]))
		oSec:Cell("SUGER"):SetValue(aCor[Val(aInd[11])])
		oSec:PrintLine()
		(cAli)->(DbSkip())
	EndDo
	oSec:Finish()
	(cAli)->(DbCloseArea())
Return Nil
