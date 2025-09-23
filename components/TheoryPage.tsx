import React from 'react';

interface TheoryPageProps {
    onViewChange: (view: 'main' | 'theory') => void;
}

export default function TheoryPage({ onViewChange }: TheoryPageProps): React.ReactElement {
    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-navy">Revisão Teórica e Artigos de Referência</h1>
                    <button 
                        onClick={() => onViewChange('main')}
                        className="px-4 py-2 border border-ocean-blue text-ocean-blue rounded-md hover:bg-sky/20"
                    >
                        &larr; Voltar ao Augmentor
                    </button>
                </div>

                <article className="prose prose-lg max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-navy">1. Fundamentação Teórica</h2>
                        <p>
                            O treinamento de modelos de deep learning robustos, especialmente para tarefas críticas como sistemas anticolisão em veleiros autônomos, exige datasets vastos e diversificados. A coleta de dados do mundo real em condições marítimas variadas é cara, demorada e, muitas vezes, perigosa. O <strong>aumento de dados (Data Augmentation)</strong> e a <strong>geração de dados sintéticos (Synthetic Data Generation)</strong> surgem como soluções estratégicas para superar essas limitações.
                        </p>
                        <p>
                            Esta ferramenta foi desenvolvida com base em metodologias de ponta da literatura científica em visão computacional. Em vez de aplicar transformações genéricas, a abordagem é inspirada por três conceitos principais:
                        </p>
                        <ul>
                            <li><strong>Geração e Validação Automatizada de Cenários:</strong> Criar imagens sintéticas que não apenas pareçam realistas, mas que também possam ser validadas e classificadas automaticamente para garantir sua qualidade e relevância para o dataset. O trabalho de <strong>Tran et al. (2023)</strong> com o SafeSea é fundamental, propondo uma pipeline que edita imagens marítimas e, em seguida, usa classificadores para verificar a preservação do objeto de interesse e categorizar o estado do mar (Sea State).</li>
                            <li><strong>Geração de Dados "Ciente da Tarefa" (Task-Aware):</strong> Ir além da simples criação de mais dados e focar na geração de dados que são especificamente úteis para melhorar o desempenho do modelo. Isso inclui a "mineração de exemplos difíceis" (hard example mining), onde o objetivo é criar cenários que desafiem o modelo, como objetos parcialmente ocluídos ou em condições de baixa visibilidade. O artigo de <strong>Tripathi et al. (2018)</strong> introduz um framework onde uma rede "sintetizadora" aprende a criar exemplos que enganam uma rede "alvo", forçando-a a aprender características mais robustas.</li>
                            <li><strong>Aumento de Robustez contra Perturbações do Mundo Real:</strong> Garantir que o modelo treinado com dados sintéticos generalize bem para o mundo real, onde as imagens podem sofrer degradação devido à compressão de transmissão, ruído do sensor, ou desfoque de movimento. <strong>Amarantidou et al. (2025)</strong> demonstram que a aplicação deliberada dessas perturbações como uma etapa de aumento de dados melhora significativamente a resiliência dos modelos de detecção.</li>
                        </ul>
                        <p>
                            Ao integrar esses três pilares, esta ferramenta visa criar um dataset sintético de alta qualidade que não apenas aumenta a quantidade de dados, mas estrategicamente melhora a robustez e a capacidade de generalização do sistema anticolisão.
                        </p>
                    </section>

                     <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-navy">2. Artigos de Referência</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
                            <div className="border rounded-lg p-4 shadow-sm">
                                <img src="https://picsum.photos/seed/safesea/400/200" alt="Abstract representation of SafeSea paper" className="rounded-md mb-3" />
                                <h3 className="font-bold text-navy">SafeSea: Synthetic Data Generation for Adverse & Low Probability Maritime Conditions</h3>
                            </div>
                             <div className="border rounded-lg p-4 shadow-sm">
                                <img src="https://picsum.photos/seed/compositing/400/200" alt="Abstract representation of compositing paper" className="rounded-md mb-3" />
                                <h3 className="font-bold text-navy">Learning to Generate Synthetic Data via Compositing</h3>
                            </div>
                             <div className="border rounded-lg p-4 shadow-sm">
                                <img src="https://picsum.photos/seed/augmentations/400/200" alt="Abstract representation of augmentations paper" className="rounded-md mb-3" />
                                <h3 className="font-bold text-navy">Composite Data Augmentations for Synthetic Image Detection against Real-World Perturbations</h3>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-navy">3. Tabela Comparativa</h2>
                        <div className="overflow-x-auto not-prose">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-navy text-white">
                                    <tr>
                                        <th className="p-3 border">Artigo (Citação LaTeX)</th>
                                        <th className="p-3 border">Contribuição Principal</th>
                                        <th className="p-3 border">Conceito-Chave Aplicado</th>
                                        <th className="p-3 border">Benefício para o Projeto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-3 border font-mono text-sm">`tran2023safesea`</td>
                                        <td className="p-3 border">Pipeline automatizada para gerar imagens marítimas sintéticas com diferentes estados do mar, incluindo classificação e validação da preservação do objeto.</td>
                                        <td className="p-3 border"><strong>1. Classificação de Estado do Mar:</strong> Gerar e validar imagens para condições marítimas específicas.<br/><strong>2. Verificação de Preservação:</strong> Garantir que o objeto de interesse (veleiro) não seja corrompido durante a geração.</td>
                                        <td className="p-3 border">Enriquece o dataset com metadados cruciais (`sea_state`) e melhora a qualidade geral ao descartar gerações mal-sucedidas, economizando tempo de triagem manual.</td>
                                    </tr>
                                    <tr className="border-b bg-gray-50">
                                        <td className="p-3 border font-mono text-sm">`tripathi2018learning`</td>
                                        <td className="p-3 border">Framework de geração de dados sintéticos "ciente da tarefa" (task-aware) que aprende a criar exemplos difíceis (hard examples) para treinar modelos mais robustos.</td>
                                        <td className="p-3 border"><strong>1. Mineração de Exemplos Difíceis:</strong> Simular a geração de "hard examples" através de uma etapa de avaliação pós-geração para identificar imagens onde o veleiro é desafiador de detectar.</td>
                                        <td className="p-3 border">Cria um subconjunto de dados de treinamento de alta dificuldade, crucial para melhorar o desempenho do modelo em cenários de oclusão parcial. Aumenta a generalização do modelo.</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 border font-mono text-sm">`amarantidou2025composite`</td>
                                        <td className="p-3 border">Investigação de combinações de data augmentation para melhorar a robustez de detectores de imagens sintéticas contra perturbações do mundo real (compressão, ruído, etc.).</td>
                                        <td className="p-3 border"><strong>Aumento com Perturbações:</strong> Introdução de uma etapa de pós-processamento para aplicar filtros de compressão JPEG, desfoque e ruído gaussiano às imagens geradas.</td>
                                        <td className="p-3 border">Aumenta significativamente a robustez do modelo final, tornando-o mais eficaz em condições não ideais (ex: imagens de câmeras de baixa qualidade, transmitidas pela internet ou em condições de movimento).</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-navy">4. Referências Bibliográficas (Formato BibTeX)</h2>
                        <div className="space-y-4 not-prose">
                            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`@inproceedings{tran2023safesea,
  title={SafeSea: Synthetic Data Generation for Adverse & Low Probability Maritime Conditions},
  author={Tran, Martin and Shipard, Jordan and Mulyono, Hermawan and Wiliem, Arnold and Fookes, Clinton},
  booktitle={arXiv preprint arXiv:2311.14764},
  year={2023}
}`}
                            </pre>
                            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`@inproceedings{tripathi2018learning,
  title={Learning to Generate Synthetic Data via Compositing},
  author={Tripathi, Shashank and Chandra, Siddhartha and Agrawal, Amit and Tyagi, Ambrish and Rehg, James M and Chari, Visesh},
  booktitle={Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR)},
  pages={461--469},
  year={2018}
}`}
                            </pre>
                             <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`@article{amarantidou2025composite,
  title={Composite Data Augmentations for Synthetic Image Detection against Real-World Perturbations},
  author={Amarantidou, Efthymia and Koutlis, Christos and Papadopoulos, Symeon and Petrantonakis, Panagiotis C.},
  journal={arXiv preprint arXiv:2506.11490},
  year={2025}
}`}
                            </pre>
                        </div>
                    </section>

                </article>
            </div>
        </main>
    );
}