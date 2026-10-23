<?php
/**
 * Diagnóstico da publicação do site MAIS i9 na hospedagem.
 * Envie para public_html, abra https://www.maisi9.com.br/diagnostico.php e APAGUE depois do uso.
 * Não mostra senhas nem caminhos do servidor.
 */
declare(strict_types=1);
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex');

$itens = [];
$ok = static function (string $titulo, bool $passou, string $detalhe = '') use (&$itens): void {
    $itens[] = [$titulo, $passou, $detalhe];
};

$ok('PHP 8.1 ou mais novo', version_compare(PHP_VERSION, '8.1.0', '>='), 'versão ' . PHP_VERSION);
$ok('Página inicial (index.html)', is_file(__DIR__ . '/index.html'));

$css = glob(__DIR__ . '/_next/static/chunks/*.css') ?: [];
$js = glob(__DIR__ . '/_next/static/chunks/*.js') ?: [];
$ok('Pasta _next com o visual do site (CSS)', count($css) > 0, count($css) . ' arquivo(s) CSS');
$ok('Pasta _next com os scripts do site (JS)', count($js) > 0, count($js) . ' arquivo(s) JS');

// O index.html aponta para um CSS específico: ele precisa existir.
$html = @file_get_contents(__DIR__ . '/index.html') ?: '';
if (preg_match('#href="(/_next/static/[^"]+\.css)"#', $html, $m)) {
    $ok('CSS usado pela página inicial está no servidor', is_file(__DIR__ . $m[1]), $m[1]);
}

$ok('Páginas internas (ex.: /sobre/)', is_file(__DIR__ . '/sobre/index.html'));
$ok('Arquivo .htaccess', is_file(__DIR__ . '/.htaccess'), 'arquivo oculto: ative "mostrar ocultos" no Gerenciador');
$ok('Formulários: contato.php', is_file(__DIR__ . '/contato.php'));
$ok('Formulários: contato-opcoes.json', is_file(__DIR__ . '/contato-opcoes.json'));

$configs = array_filter([dirname(__DIR__) . '/contato-config.php' => 'acima de public_html', __DIR__ . '/contato-config.php' => 'dentro de public_html'], static fn($k) => @is_file($k), ARRAY_FILTER_USE_KEY);
$config = $configs ? (require array_key_first($configs)) : [];
$metodo = $config['metodo'] ?? 'mail';
$senha = (string) ($config['smtp']['senha'] ?? '');
$smtpPronto = $metodo === 'smtp' && $senha !== '' && !str_starts_with($senha, 'COLOQUE');
$ok('Configuração de e-mail (contato-config.php)', (bool) $configs, $configs ? 'encontrada ' . reset($configs) : 'não encontrada: o envio usará mail()');
$ok('Envio por SMTP com senha preenchida', $smtpPronto, $smtpPronto ? 'servidor ' . ($config['smtp']['host'] ?? '?') : 'sem senha: usando mail() do servidor');
$ok('Função mail() disponível', function_exists('mail'));

if ($smtpPronto) {
    $porta = (int) ($config['smtp']['porta'] ?? 465);
    $alvo = ($porta === 465 ? 'ssl://' : 'tcp://') . $config['smtp']['host'] . ':' . $porta;
    $s = @stream_socket_client($alvo, $codigo, $erro, 10);
    $resposta = $s ? (string) fgets($s, 512) : '';
    if ($s) fclose($s);
    $ok('Conexão com o servidor SMTP', str_starts_with($resposta, '220'), $s ? trim($resposta) : "falhou: $erro");
}

$falhas = count(array_filter($itens, static fn($i) => !$i[1]));
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Diagnóstico | MAIS i9</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:46rem;margin:3rem auto;padding:0 1rem;color:#0a1a30;line-height:1.5}
  li{display:flex;gap:.75rem;padding:.6rem 0;border-bottom:1px solid #e3e9f0}
  .s{font-weight:700;width:3.5rem;flex-shrink:0}.ok{color:#1f9d55}.nao{color:#d64545}small{color:#5b7088;display:block}
  ul{list-style:none;padding:0}.aviso{background:#fdeedd;padding:1rem;border-radius:.75rem}
</style>
</head>
<body>
<h1>Diagnóstico da publicação</h1>
<p><?= $falhas ? "<strong class='nao'>$falhas item(ns) com problema.</strong>" : "<strong class='ok'>Tudo certo.</strong>" ?></p>
<ul>
<?php foreach ($itens as [$titulo, $passou, $detalhe]): ?>
  <li><span class="s <?= $passou ? 'ok' : 'nao' ?>"><?= $passou ? 'OK' : 'FALTA' ?></span>
  <span><?= htmlspecialchars($titulo) ?><?php if ($detalhe): ?><small><?= htmlspecialchars($detalhe) ?></small><?php endif ?></span></li>
<?php endforeach ?>
</ul>
<p class="aviso">Depois de conferir, <strong>apague este arquivo</strong> (diagnostico.php) do servidor.</p>
</body>
</html>
