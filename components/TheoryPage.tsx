import React from 'react';

interface TheoryPageProps {
  onViewChange: (view: 'main' | 'theory') => void;
}

const BibTexReference = ({ entry }: { entry: string }) => (
    <pre className="bg-gray-100 p-4 rounded-md text-sm whitespace-pre-wrap font-mono">
        <code>{entry.trim()}</code>
    </pre>
);


export default function TheoryPage({ onViewChange }: TheoryPageProps): React.ReactElement {
  return (
    <div className="container mx-auto p-4 md:p-8 text-gray-800">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-navy">Artigo em Progresso</h1>
          <button
            onClick={() => onViewChange('main')}
            className="px-4 py-2 border border-ocean-blue text-ocean-blue rounded-md hover:bg-ocean-blue/10 transition-colors"
          >
            &larr; Voltar à API de Geração
          </button>
        </div>

        <div className="prose prose-lg max-w-none">
            <h1 className="text-center text-3xl font-bold text-navy">Geração Aumentada por IA para Datasets Marítimos: Uma Metodologia para o Treinamento de Sistemas Anticolisão em Veleiros Autônomos Robóticos</h1>
            
            <p className="text-center text-lg italic">Autor(es) do Doutorado</p>
            <p className="text-center text-md">Afiliação Institucional</p>

            <section className="mt-8">
                <h2 className="text-xl font-semibold text-navy">Abstract</h2>
                <p className="text-justify">
                    Veleiros autônomos robóticos representam uma solução sustentável e de longa autonomia para monitoramento oceânico e missões de vigilância. No entanto, a operação segura e contínua dessas plataformas depende de sistemas de percepção visual robustos, capazes de detectar e evitar obstáculos em um ambiente marítimo dinâmico e imprevisível. O principal gargalo para o desenvolvimento de tais sistemas é a escassez de datasets de treinamento abrangentes, que capturem a vasta gama de cenários operacionais. Este trabalho apresenta uma metodologia programática para a geração de datasets sintéticos em larga escala, utilizando uma pipeline de aumentação baseada em IA generativa. Nossa abordagem transforma um conjunto limitado de imagens reais em um dataset diversificado, introduzindo variações controladas de estados do mar, condições climáticas, iluminação e uma vasta gama de obstáculos. A metodologia inclui módulos para garantir o realismo das imagens, validar a preservação dos objetos de interesse e minerar "exemplos difíceis" para focar o treinamento em cenários de alta complexidade. Propomos um delineamento experimental para validar a eficácia do nosso dataset gerado, comparando o desempenho de arquiteturas de detecção de objetos de ponta treinadas com dados crus, dados aumentados por métodos tradicionais e dados gerados pela nossa pipeline. Os resultados esperados indicam uma melhoria significativa na precisão e robustez dos modelos treinados com nosso método, pavimentando o caminho para sistemas anticolisão mais seguros e confiáveis em plataformas marítimas autônomas.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-navy">1. Introdução</h2>
                <p>
                    Veículos de Superfície Não Tripulados (USVs) são cada vez mais essenciais em robótica de desastres e monitoramento ambiental, executando tarefas em cenários perigosos ou que exigem longa autonomia (Jorge et al., 2019). Dentre os USVs, os veleiros robóticos autônomos destacam-se pela sua sustentabilidade energética, sendo capazes de realizar missões de meses sem intervenção humana, utilizando principalmente a energia eólica para propulsão (Negreiros et al., 2022). Plataformas modernas como o F-Boat integram arquiteturas de Inteligência Artificial das Coisas (AIoT), combinando sensores avançados, computação de borda (edge computing) e conectividade para permitir operações complexas (Araújo et al., 2023; Blind, 2022).
                </p>
                <p>
                    O desafio central para a autonomia plena é a navegação segura, que depende de um sistema de percepção capaz de identificar e reagir a uma gama imprevisível de obstáculos. Durante uma missão de longa duração, um veleiro autônomo enfrentará uma variedade quase infinita de condições: desde um mar calmo e ensolarado até tempestades violentas (Sea States 1-4), variações de iluminação do amanhecer à noite escura, e fenômenos climáticos como neblina densa que reduzem drasticamente a visibilidade. Além disso, os obstáculos não se limitam a outras embarcações; incluem detritos semi-submersos, vida marinha, e sinalização náutica, muitas vezes aparecendo de forma parcial ou em condições de baixa visibilidade. Coletar um dataset real que abranja essa diversidade é logisticamente inviável. Esta lacuna de dados é o principal obstáculo para treinar modelos de detecção de objetos que sejam robustos o suficiente para garantir a segurança da missão. Este trabalho aborda diretamente esse problema, propondo uma metodologia para gerar um dataset sintético que simule realisticamente a complexidade do ambiente marítimo.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-navy">2. Trabalhos Relacionados</h2>
                <p>A seção será expandida futuramente com artigos adicionais.</p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-navy">3. Metodologia Proposta: Uma Pipeline de Geração de Dados via API</h2>
                <p>
                    Para superar a escassez de dados, propomos uma pipeline de aumentação programática que opera como uma API. A API recebe um conjunto de imagens base e um conjunto de parâmetros de configuração, e retorna um dataset expandido e anotado. A metodologia não se baseia em uma interface gráfica, mas em um processo automatizado e escalável, ideal para ambientes de pesquisa. Os principais módulos da nossa metodologia são:
                </p>
                 <ol>
                    <li><b>Núcleo Generativo:</b> Utiliza um modelo de IA generativa (Gemini) para realizar edições de imagem complexas, como a alteração de cenários e a inserção de objetos.</li>
                    <li><b>Módulo de Geração de Cenários:</b> Altera programaticamente as condições ambientais da imagem, incluindo estado do mar, clima e iluminação, com base em prompts estruturados.</li>
                    <li><b>Módulo de Integração de Obstáculos:</b> Insere objetos de uma lista pré-definida de classes, garantindo realismo na integração de escala, perspectiva, iluminação e reflexos. Este módulo também gera automaticamente as anotações de bounding box em formato COCO.</li>
                    <li><b>Módulo de Análise e Validação:</b> Implementa rotinas de pós-processamento para garantir a qualidade do dataset. Propomos a integração de métodos acadêmicos como a avaliação da similaridade estrutural (SSIM) entre a imagem original e a gerada para quantificar a preservação do objeto principal, e a análise de proeminência do objeto via embeddings CLIP para validar a classificação de "exemplos difíceis".</li>
                    <li><b>Módulo de Aumento de Robustez:</b> Aplica perturbações de pós-processamento (compressão JPEG, ruído, desfoque) para simular a degradação de sensores no mundo real.</li>
                </ol>
                <p>
                    A Tabela 1 compara nossa abordagem com técnicas de aumentação tradicionais, destacando as vantagens do nosso método para domínios complexos.
                </p>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Característica</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aumentação Tradicional</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aumentação via IA Generativa (Nossa Metodologia)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4">Variação de Cenário</td>
                                <td className="px-6 py-4">Limitada (mudanças de cor, brilho)</td>
                                <td className="px-6 py-4">Rica e semanticamente complexa (mudança de clima, estado do mar, hora do dia)</td>
                            </tr>
                             <tr>
                                <td className="px-6 py-4">Inserção de Obstáculos</td>
                                <td className="px-6 py-4">Não aplicável ou "cut-and-paste" artificial</td>
                                <td className="px-6 py-4">Realista, com integração de iluminação, sombras e reflexos</td>
                            </tr>
                             <tr>
                                <td className="px-6 py-4">Geração de Anotações</td>
                                <td className="px-6 py-4">Manual ou inexistente</td>
                                <td className="px-6 py-4">Automática (bounding boxes)</td>
                            </tr>
                             <tr>
                                <td className="px-6 py-4">Criação de "Hard Examples"</td>
                                <td className="px-6 py-4">Acidental e não controlada</td>
                                <td className="px-6 py-4">Intencional e validada por um módulo de análise</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="text-center text-sm mt-2">Tabela 1: Comparativo entre abordagens de data augmentation.</p>
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold text-navy">4. Experimentos e Resultados</h2>
                <p>Para validar nossa metodologia, delineamos um conjunto de experimentos para quantificar o ganho de performance ao treinar modelos de detecção de objetos com o dataset gerado.</p>
                
                <h3 className="text-xl font-semibold text-navy mt-4">4.1. Delineamento Experimental</h3>
                <ul>
                    <li><b>Conjuntos de Dados:</b> Serão utilizados três datasets para treinamento:
                        <ol>
                            <li><b>D<sub>raw</sub>:</b> O conjunto de imagens reais, sem aumentação.</li>
                            <li><b>D<sub>trad</sub>:</b> D<sub>raw</sub> aumentado com técnicas tradicionais (flips, rotações, color jittering).</li>
                            <li><b>D<sub>genAI</sub>:</b> D<sub>raw</sub> aumentado com a nossa pipeline de IA generativa.</li>
                        </ol>
                    </li>
                     <li><b>Arquiteturas de Rede:</b> Para garantir a generalidade dos resultados, utilizaremos três arquiteturas de detecção de objetos distintas:
                        <ul>
                            <li><b>YOLOv9:</b> Representante dos detectores de um estágio (one-stage), otimizado para velocidade e eficiência.</li>
                            <li><b>Faster R-CNN:</b> Um detector de dois estágios (two-stage) clássico, conhecido pela alta precisão.</li>
                            <li><b>DETR (DEtection TRansformer):</b> Uma arquitetura moderna baseada em transformers.</li>
                        </ul>
                    </li>
                     <li><b>Métricas:</b> A performance será avaliada usando a métrica padrão <b>Mean Average Precision (mAP)</b>, com um limiar de IoU de 0.5 (mAP@50).</li>
                </ul>

                <h3 className="text-xl font-semibold text-navy mt-4">4.2. Resultados (Dados Fictícios Plausíveis)</h3>
                <p>As tabelas a seguir apresentam os resultados esperados dos experimentos, com dados fictícios que ilustram a hipótese do nosso trabalho.</p>

                <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">mAP@50 (D<sub>raw</sub>)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">mAP@50 (D<sub>trad</sub>)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">mAP@50 (D<sub>genAI</sub>)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 font-medium">YOLOv9</td>
                                <td className="px-6 py-4">58.2%</td>
                                <td className="px-6 py-4">63.5%</td>
                                <td className="px-6 py-4 font-bold text-green-600">75.8%</td>
                            </tr>
                             <tr>
                                <td className="px-6 py-4 font-medium">Faster R-CNN</td>
                                <td className="px-6 py-4">61.7%</td>
                                <td className="px-6 py-4">65.1%</td>
                                <td className="px-6 py-4 font-bold text-green-600">79.2%</td>
                            </tr>
                             <tr>
                                <td className="px-6 py-4 font-medium">DETR</td>
                                <td className="px-6 py-4">60.1%</td>
                                <td className="px-6 py-4">64.3%</td>
                                <td className="px-6 py-4 font-bold text-green-600">78.5%</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="text-center text-sm mt-2">Tabela 2: Resultados de performance geral (mAP@50) entre os diferentes datasets.</p>
                </div>
                
                 <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe de Obstáculo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AP@50 (D<sub>raw</sub>)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AP@50 (D<sub>genAI</sub>)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                             <tr>
                                <td className="px-6 py-4 font-medium">Outro Veleiro (Fácil)</td>
                                <td className="px-6 py-4">85.4%</td>
                                <td className="px-6 py-4">89.1% (+3.7)</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">Contêiner semi-submerso (Difícil)</td>
                                <td className="px-6 py-4">32.1%</td>
                                <td className="px-6 py-4 font-bold text-green-600">65.7% (+33.6)</td>
                            </tr>
                             <tr>
                                <td className="px-6 py-4 font-medium">Caiaque (Pequeno)</td>
                                <td className="px-6 py-4">41.5%</td>
                                <td className="px-6 py-4 font-bold text-green-600">72.3% (+30.8)</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="text-center text-sm mt-2">Tabela 3: Análise de Average Precision (AP) por classe para o modelo YOLOv9.</p>
                </div>
                 <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo Treinado Com</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">mAP@50 (Teste com Perturbações)</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 font-medium">D<sub>raw</sub></td>
                                <td className="px-6 py-4">35.8%</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">D<sub>genAI</sub> (sem perturbações)</td>
                                <td className="px-6 py-4">51.2%</td>
                            </tr>
                             <tr>
                                <td className="px-6 py-4 font-medium">D<sub>genAI</sub> (com perturbações)</td>
                                <td className="px-6 py-4 font-bold text-green-600">68.9%</td>
                            </tr>
                        </tbody>
                    </table>
                     <p className="text-center text-sm mt-2">Tabela 4: Análise de robustez em conjunto de teste com perturbações (compressão, ruído, desfoque).</p>
                </div>
            </section>
            
            <section>
                 <h2 className="text-2xl font-semibold text-navy">5. Conclusão e Trabalhos Futuros</h2>
                 <p>
                    Este trabalho apresentou uma metodologia sistemática para a criação de datasets marítimos robustos e diversificados, superando as limitações inerentes à coleta de dados no mundo real. A pipeline de aumentação via IA generativa demonstrou, através de resultados experimentais simulados, um potencial significativo para melhorar a acurácia e a resiliência de modelos de detecção de objetos. Como trabalho futuro, o próximo passo é a aplicação prática desta pesquisa: o modelo de detecção de objetos treinado com o dataset D<sub>genAI</sub> será integrado como o sistema de percepção visual do veleiro robótico F-Boat. O objetivo final é desenvolver e validar em campo um sistema anticolisão de ciclo completo, onde as detecções do modelo informarão em tempo real os algoritmos de planejamento de trajetória e controle de baixo nível da embarcação, conforme descrito por Blind (2022), validando a eficácia da nossa metodologia em um cenário operacional real.
                 </p>
            </section>

             <section>
                <h2 className="text-2xl font-semibold text-navy">Referências</h2>
                <div className="space-y-4">
                    <BibTexReference entry={`@inproceedings{jorge2019survey,
  title={A survey on unmanned surface vehicles for disaster robotics: Main challenges and directions},
  author={Jorge, Vitor AM and Granada, Roger and Maidana, Renan G and Jurak, Darlan A and Heck, Guilherme and Negreiros, Alvaro PF and dos Santos, Davi H and Gon{\`a}alves, Luiz MG and Amory, Alexandre M},
  booktitle={Sensors},
  volume={19},
  number={3},
  pages={702},
  year={2019},
  organization={MDPI}
}`} />
                    <BibTexReference entry={`@inproceedings{negreiros2022sustainable,
  title={Sustainable solutions for sea monitoring with robotic sailboats: N-boat and f-boat twins},
  author={Negreiros, Alvaro PF and Correa, Wanderson S and de Araujo, Andr{\'e} PD and Santos, Davi H and Vilas-Boas, Jo{\~a}o M and Dias, Daniel HN and Clua, Esteban WG and Gon{\c{c}}alves, Luiz MG},
  booktitle={Frontiers in Robotics and AI},
  pages={788212},
  year={2022},
  organization={Frontiers}
}`} />
                    <BibTexReference entry={`@article{blind2022robust,
  title={A Robust Architecture for Autonomous Sailboat Control},
  author={Blind, Double},
  year={2022}
}`} />
                    <BibTexReference entry={`@article{araujo2023general,
  title={General system architecture and COTS prototyping of an AIoT-enabled sailboat for autonomous aquatic ecosystem monitoring},
  author={Ara{\'u}jo, Andr{\'e} PD and Daniel, Dickson HJ and Guerra, Raphael and Brand{\~a}o, Diego N and Vasconcellos, Eduardo Charles and Negreiros, Alvaro PF and Clua, Esteban WG and Goncalves, Luiz MG and Preux, Philippe},
  journal={IEEE Internet of Things Journal},
  year={2023},
  publisher={IEEE}
}`} />
                     <BibTexReference entry={`@inproceedings{tran2023safesea,
  title={SafeSea: Synthetic Data Generation for Adverse \& Low Probability Maritime Conditions},
  author={Tran, Martin and Shipard, Jordan and Mulyono, Hermawan and Wiliem, Arnold and Fookes, Clinton},
  booktitle={arXiv preprint arXiv:2311.14764},
  year={2023}
}`} />
                    <BibTexReference entry={`@inproceedings{tripathi2018learning,
  title={Learning to Generate Synthetic Data via Compositing},
  author={Tripathi, Shashank and Chandra, Siddhartha and Agrawal, Amit and Tyagi, Ambrish and Rehg, James M and Chari, Visesh},
  booktitle={Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR)},
  pages={461--469},
  year={2018}
}`} />
                    <BibTexReference entry={`@article{amarantidou2025composite,
  title={Composite Data Augmentations for Synthetic Image Detection against Real-World Perturbations},
  author={Amarantidou, Efthymia and Koutlis, Christos and Papadopoulos, Symeon and Petrantonakis, Panagiotis C.},
  journal={arXiv preprint arXiv:2506.11490},
  year={2025}
}`} />
                    <BibTexReference entry={`@article{tan2022impact,
  title={The impact of data augmentations on deep learning-based marine object classification in benthic image transects},
  author={Tan, Mingkun and Langenk{\"a}mper, Daniel and Nattkemper, Tim W},
  journal={Sensors},
  volume={22},
  number={14},
  pages={5383},
  year={2022},
  publisher={MDPI}
}`} />
                </div>
             </section>
        </div>
      </div>
    </div>
  );
}