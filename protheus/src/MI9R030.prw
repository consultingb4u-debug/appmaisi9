#Include "Protheus.ch"

/*/{Protheus.doc} MI9R030
Alertas do dia: atividades atrasadas, pendências vencidas, recursos sobrecarregados e indisponibilidades a aprovar.
Gravidade alta primeiro. Mesmas regras do e-mail diário (MI9J010).
@author MAIS i9
/*/
User Function MI9R030()
	Local oReport := TReport():New("MI9R030", "Alertas da gestão de projetos", , {|oRep| Imprimir(oRep)}, ;
		"Situações que precisam de ação, com gravidade e responsáveis.")
	Local oSec := TRSection():New(oReport, "Alertas", {})
	oReport:SetLandscape()
	TRCell():New(oSec, "GRAV", , "Gravidade", "", 9)
	TRCell():New(oSec, "TIPO", , "Tipo", "", 26)
	TRCell():New(oSec, "TITULO", , "Alerta", "", 60)
	TRCell():New(oSec, "DETALHE", , "Detalhe", "", 80)
	TRCell():New(oSec, "AVISAR", , "Avisar", "", 40)
	oReport:PrintDialog()
Return Nil

Static Function Imprimir(oReport)
	Local oSec := oReport:Section(1)
	Local aAle := U_MI9ALER(dDataBase)
	Local cAvisar := ""
	Local nI := 0
	Local nJ := 0
	oReport:SetMeter(Len(aAle))
	oSec:Init()
	For nI := 1 To Len(aAle)
		If oReport:Cancel()
			Exit
		EndIf
		oReport:IncMeter()
		cAvisar := ""
		For nJ := 1 To Len(aAle[nI][6])
			cAvisar += IIf(Empty(cAvisar), "", ", ") + AllTrim(Posicione("ZM1", 1, xFilial("ZM1") + aAle[nI][6][nJ], "ZM1_NOME"))
		Next nJ
		If aAle[nI][7]
			cAvisar += IIf(Empty(cAvisar), "", ", ") + "gestores"
		EndIf
		oSec:Cell("GRAV"):SetValue(IIf(aAle[nI][3] == "ALTA", "Alta", "Média"))
		oSec:Cell("TIPO"):SetValue(U_MI9TPAL(aAle[nI][2]))
		oSec:Cell("TITULO"):SetValue(aAle[nI][4])
		oSec:Cell("DETALHE"):SetValue(aAle[nI][5])
		oSec:Cell("AVISAR"):SetValue(cAvisar)
		oSec:PrintLine()
	Next nI
	oSec:Finish()
	If Len(aAle) == 0
		oReport:PrintText("Nenhum alerta hoje.")
	EndIf
Return Nil
