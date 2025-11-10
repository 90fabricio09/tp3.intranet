import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { auth, db } from '../firebase';
import './Dashboard.css';
import logoBranca from '../assets/Logo-branca.png';

function Dashboard() {
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImovel, setEditingImovel] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Imagens já salvas no banco
  const [searchNome, setSearchNome] = useState('');
  const [searchRegiao, setSearchRegiao] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    regiao: '',
    tipo: 'venda',
    preco: '',
    quartos: '',
    banheiros: '',
    area: ''
  });

  useEffect(() => {
    loadImoveis();
  }, []);

  const loadImoveis = async () => {
    try {
      const q = query(collection(db, 'imoveis'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setImoveis(data);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const openModal = (imovel = null) => {
    if (imovel) {
      setEditingImovel(imovel);
      setFormData({
        nome: imovel.nome || '',
        descricao: imovel.descricao || '',
        regiao: imovel.regiao || '',
        tipo: imovel.tipo || 'venda',
        preco: imovel.preco !== undefined && imovel.preco !== null ? String(imovel.preco) : '',
        quartos: imovel.quartos !== undefined && imovel.quartos !== null ? String(imovel.quartos) : '',
        banheiros: imovel.banheiros !== undefined && imovel.banheiros !== null ? String(imovel.banheiros) : '',
        area: imovel.area !== undefined && imovel.area !== null ? String(imovel.area) : ''
      });
      // Separar imagens existentes das novas
      const existingImgs = imovel.imagens || [];
      setExistingImages(existingImgs);
      setPreviewUrls(existingImgs);
    } else {
      setEditingImovel(null);
      setFormData({
        nome: '',
        descricao: '',
        regiao: '',
        tipo: 'venda',
        preco: '',
        quartos: '',
        banheiros: '',
        area: ''
      });
      setExistingImages([]);
      setPreviewUrls([]);
    }
    setSelectedFiles([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingImovel(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImages([]);
    setUploadProgress(0);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Adicionar novos arquivos aos existentes
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Criar previews apenas dos novos arquivos
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newUrls]);
  };

  const removePreview = (index) => {
    // Número de imagens existentes (já salvas no banco)
    const numExistingImages = existingImages.length;
    
    if (index < numExistingImages) {
      // Remover de imagens existentes
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
    } else {
      // Remover de arquivos novos selecionados
      const fileIndex = index - numExistingImages;
      const newSelectedFiles = selectedFiles.filter((_, i) => i !== fileIndex);
      setSelectedFiles(newSelectedFiles);
    }
    
    // Remover do preview
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newPreviewUrls);
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.15, // Máximo 150KB por imagem (bem comprimido para Firestore)
      maxWidthOrHeight: 1200, // Máximo 1200px
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.7 // Qualidade 70% para maior compressão
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
      return compressedFile;
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      return file;
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const processImages = async () => {
    const base64Images = [];
    
    // Processar apenas os novos arquivos selecionados
    if (selectedFiles.length > 0) {
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        
        setUploadProgress(Math.round(((i + 0.3) / totalFiles) * 100));
        const compressedFile = await compressImage(file);
        
        setUploadProgress(Math.round(((i + 0.6) / totalFiles) * 100));
        const base64 = await convertToBase64(compressedFile);
        
        base64Images.push(base64);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
    }

    // Combinar imagens existentes (que não foram removidas) com as novas
    const totalImages = [...existingImages, ...base64Images];
    
    // Limitar a 10 imagens no total
    if (totalImages.length > 10) {
      alert('Máximo de 10 fotos por imóvel. As primeiras 10 serão mantidas.');
      return totalImages.slice(0, 10);
    }

    return totalImages;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação: mínimo 1 imagem (considerando existentes + novas)
    const totalImages = existingImages.length + selectedFiles.length;
    if (totalImages === 0) {
      alert('Adicione pelo menos 1 foto do imóvel!');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Processar imagens (comprimir e converter para Base64)
      const imagens = await processImages();

      const imovelData = {
        nome: formData.nome,
        descricao: formData.descricao,
        regiao: formData.regiao,
        tipo: formData.tipo,
        preco: formData.preco ? parseFloat(formData.preco) : 0,
        quartos: formData.quartos ? parseInt(formData.quartos) : 0,
        banheiros: formData.banheiros ? parseInt(formData.banheiros) : 0,
        area: formData.area ? parseFloat(formData.area) : 0,
        imagens,
        updatedAt: serverTimestamp()
      };

      if (editingImovel) {
        // Atualizar imóvel existente
        await updateDoc(doc(db, 'imoveis', editingImovel.id), imovelData);
      } else {
        // Criar novo imóvel
        await addDoc(collection(db, 'imoveis'), {
          ...imovelData,
          createdAt: serverTimestamp()
        });
      }

      closeModal();
      loadImoveis();
    } catch (error) {
      console.error('Erro ao salvar imóvel:', error);
      alert('Erro ao salvar imóvel. Tente novamente.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      try {
        await deleteDoc(doc(db, 'imoveis', id));
        loadImoveis();
      } catch (error) {
        console.error('Erro ao excluir imóvel:', error);
        alert('Erro ao excluir imóvel. Tente novamente.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filtrar imóveis
  const filteredImoveis = imoveis.filter(imovel => {
    const matchNome = imovel.nome?.toLowerCase().includes(searchNome.toLowerCase());
    const matchRegiao = imovel.regiao?.toLowerCase().includes(searchRegiao.toLowerCase());
    const matchTipo = filterTipo === 'todos' || imovel.tipo === filterTipo;
    return matchNome && matchRegiao && matchTipo;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-header-title">
            <img src={logoBranca} alt="TP3 Logo" className="dashboard-logo-img" />
            <h1>Painel Administrativo</h1>
          </div>
          <div className="header-actions">
            <span className="user-email">
              <i className="bi bi-person-circle"></i> {auth.currentUser?.email}
            </span>
            <button onClick={handleLogout} className="logout-button">
              <i className="bi bi-box-arrow-right"></i> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-controls">
          <h2>Gestão de Imóveis</h2>
          <button onClick={() => openModal()} className="add-button">
            <i className="bi bi-plus-circle"></i> Adicionar Imóvel
          </button>
        </div>

        {/* Filtros de Busca */}
        <div className="search-filters-dashboard">
          <div className="search-container-dashboard">
            <div className="input-with-icon">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Buscar por nome do imóvel..."
                value={searchNome}
                onChange={(e) => setSearchNome(e.target.value)}
                className="search-input-dashboard"
              />
            </div>
            <div className="input-with-icon">
              <i className="bi bi-geo-alt"></i>
              <input
                type="text"
                placeholder="Buscar por região..."
                value={searchRegiao}
                onChange={(e) => setSearchRegiao(e.target.value)}
                className="search-input-dashboard"
              />
            </div>
            <div className="select-with-icon">
              <i className="bi bi-filter"></i>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="filter-select-dashboard"
              >
                <option value="todos">Todos os tipos</option>
                <option value="venda">Venda</option>
                <option value="aluguel">Arrendamento</option>
              </select>
            </div>
            {(searchNome || searchRegiao || filterTipo !== 'todos') && (
              <button 
                onClick={() => {
                  setSearchNome('');
                  setSearchRegiao('');
                  setFilterTipo('todos');
                }}
                className="clear-filters-button"
                title="Limpar filtros"
              >
                <i className="bi bi-x-circle"></i> Limpar
              </button>
            )}
          </div>
          <div className="results-count">
            <i className="bi bi-info-circle"></i> 
            Mostrando {filteredImoveis.length} de {imoveis.length} imóveis
          </div>
        </div>

        <div className="imoveis-table-container">
          {filteredImoveis.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>
                {imoveis.length === 0 
                  ? 'Nenhum imóvel cadastrado ainda.' 
                  : 'Nenhum imóvel encontrado com os filtros selecionados.'}
              </p>
              {imoveis.length === 0 && (
                <button onClick={() => openModal()} className="add-button">
                  <i className="bi bi-plus-circle"></i> Adicionar Primeiro Imóvel
                </button>
              )}
            </div>
          ) : (
            <table className="imoveis-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nome</th>
                  <th>Região</th>
                  <th>Tipo</th>
                  <th>Preço</th>
                  <th>Detalhes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredImoveis.map(imovel => (
                  <tr key={imovel.id}>
                    <td>
                      {imovel.imagens && imovel.imagens.length > 0 ? (
                        <img 
                          src={imovel.imagens[0]} 
                          alt={imovel.nome}
                          className="table-thumbnail"
                        />
                      ) : (
                        <div className="table-thumbnail-placeholder">
                          <i className="bi bi-house-door"></i>
                        </div>
                      )}
                    </td>
                    <td>{imovel.nome}</td>
                    <td>{imovel.regiao}</td>
                    <td>
                      <span className={`tipo-badge ${imovel.tipo}`}>
                        {imovel.tipo === 'venda' ? 'VENDA' : 'ARRENDAMENTO'}
                      </span>
                    </td>
                    <td>€{imovel.preco?.toLocaleString('pt-PT')}</td>
                    <td>
                      <div className="details">
                        {imovel.quartos > 0 && (
                          <span className="detail-item">
                            <i className="bi bi-door-closed"></i> {imovel.quartos}
                          </span>
                        )}
                        {imovel.banheiros > 0 && (
                          <span className="detail-item">
                            <i className="bi bi-droplet"></i> {imovel.banheiros}
                          </span>
                        )}
                        {imovel.area > 0 && (
                          <span className="detail-item">
                            <i className="bi bi-rulers"></i> {imovel.area}m²
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => openModal(imovel)} 
                          className="edit-button"
                          title="Editar"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(imovel.id)} 
                          className="delete-button"
                          title="Excluir"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingImovel ? 'Editar Imóvel' : 'Adicionar Imóvel'}</h2>
              <button onClick={closeModal} className="close-button">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="imovel-form">
              {/* Upload de Imagens */}
              <div className="form-group-full">
                <label htmlFor="imagens">
                  Fotos do Imóvel * (mínimo 1, máximo 10 fotos)
                  {editingImovel && ' - Adicione mais fotos ou mantenha as existentes'}
                </label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    id="imagens"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <label htmlFor="imagens" className="file-input-label">
                    <i className="bi bi-camera"></i> Selecionar Fotos
                  </label>
                  <span className="file-count">
                    {previewUrls.length > 0 
                      ? `${previewUrls.length} foto(s) ${editingImovel ? 'total' : 'selecionada(s)'}`
                      : 'Nenhuma foto selecionada'}
                  </span>
                </div>

                {previewUrls.length > 0 && (
                  <div className="image-preview-grid">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={url} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removePreview(index)}
                          className="remove-image-btn"
                          title="Remover foto"
                        >
                          ✕
                        </button>
                        {index === 0 && <span className="main-badge">Principal</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nome">Nome do Imóvel *</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Casa T3 no Centro"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="regiao">Região *</label>
                  <input
                    type="text"
                    id="regiao"
                    name="regiao"
                    value={formData.regiao}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Centro de Viseu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Descreva as características do imóvel..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tipo">Tipo *</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="venda">Venda</option>
                    <option value="aluguel">Arrendamento</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="preco">Preço (€)</label>
                  <input
                    type="number"
                    id="preco"
                    name="preco"
                    value={formData.preco}
                    onChange={handleInputChange}
                    placeholder="150000"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quartos">Quartos</label>
                  <input
                    type="number"
                    id="quartos"
                    name="quartos"
                    value={formData.quartos}
                    onChange={handleInputChange}
                    placeholder="3"
                    min="0"
                    step="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="banheiros">Banheiros</label>
                  <input
                    type="number"
                    id="banheiros"
                    name="banheiros"
                    value={formData.banheiros}
                    onChange={handleInputChange}
                    placeholder="2"
                    min="0"
                    step="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="area">Área (m²)</label>
                  <input
                    type="number"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="120"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p>Processando fotos... {uploadProgress}%</p>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="cancel-button" disabled={uploading}>
                  Cancelar
                </button>
                <button type="submit" className="save-button" disabled={uploading}>
                  {uploading 
                    ? 'Salvando...' 
                    : editingImovel ? 'Salvar Alterações' : 'Adicionar Imóvel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
