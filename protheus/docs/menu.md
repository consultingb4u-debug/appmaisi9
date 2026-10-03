# Menu e acessos

Sugestão: criar no SIGACFG um menu **Gestão de Projetos MAIS i9** (pode ficar dentro do módulo que a equipe já usa, por exemplo SIGAPMS ou SIGAFAT) com os itens abaixo. Em *Tipo*, use **Função de usuário** e informe o nome sem o `U_` quando o configurador pedir apenas o nome da função.

| Grupo | Item de menu | Função | Quem acessa |
|---|---|---|---|
| Atualizações | Projetos | `U_MI9A020` | Gestores e GPs |
| Atualizações | Recursos e indisponibilidades | `U_MI9A010` | Gestores (consultores só para registrar ausências, se desejado) |
| Atualizações | Apontamento de horas | `U_MI9A030` | Todos |
| Atualizações | Alocações avulsas | `U_MI9A040` | Gestores e GPs |
| Atualizações | Feriados | `U_MI9A050` | Gestores |
| Relatórios | Capacidade por semana | `U_MI9R010` | Gestores e GPs |
| Relatórios | Portfólio de projetos | `U_MI9R020` | Gestores e GPs |
| Relatórios | Alertas | `U_MI9R030` | Todos |
| Miscelânea | Enviar alertas agora | `U_MI9J010` | Administrador |
| Miscelânea | Testes das regras | `U_MI9TST` | Administrador |
| Miscelânea | Atualizar dicionário | `U_MI9DIC` | Administrador (só na implantação) |

## Perfis

- **Gestor**: recurso com `ZM1_GESTOR = 1` ou administrador do Protheus. Aprova indisponibilidades, aponta por outras pessoas e recebe os alertas de sobrecarga e de ausências a aprovar.
- **Consultor**: recurso com o usuário do Protheus vinculado (`ZM1_USER`). Aponta as próprias horas nas atividades em que está atribuído e recebe os alertas das próprias atividades.
- **GP do projeto** (`ZM3_GP`): recebe os alertas de atividades atrasadas e pendências vencidas do projeto.

## Agendamento (Schedule)

| Rotina | Quando | Parâmetros |
|---|---|---|
| `U_MI9J010` | Segunda a sexta, 7h | Empresa e filial |

`MV_MI9MAIL = .F.` deixa o job em modo de teste (só registra no console do AppServer). `MV_MI9DIAS` define quantas semanas à frente entram no alerta de sobrecarga (padrão 2).
