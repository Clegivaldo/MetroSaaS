import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string;
  action: string;
}

const EmailSettings: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    variables: '',
    action: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables,
      action: template.action
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/email-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTemplates();
        setEditingTemplate(null);
        setFormData({ name: '', subject: '', body: '', variables: '', action: '' });
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const getActionBadgeColor = (action: string) => {
    const colors: { [key: string]: string } = {
      user_created: 'bg-green-100 text-green-800',
      certificate_created: 'bg-blue-100 text-blue-800',
      certificate_expiring: 'bg-yellow-100 text-yellow-800',
      password_reset: 'bg-red-100 text-red-800',
      appointment_created: 'bg-purple-100 text-purple-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuração de Emails</h1>
        <p className="text-gray-600">Gerencie os templates de email do sistema</p>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    <Badge className={getActionBadgeColor(template.action)}>
                      {template.action}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Variáveis: {template.variables}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  Editar
                </Button>
              </div>
            </CardHeader>
            
            {editingTemplate?.id === template.id ? (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="body">Corpo do Email</Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      rows={10}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="variables">Variáveis (separadas por vírgula)</Label>
                    <Input
                      id="variables"
                      value={formData.variables}
                      onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>Salvar</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingTemplate(null);
                        setFormData({ name: '', subject: '', body: '', variables: '', action: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>Assunto:</strong> {template.subject}
                  </div>
                  <div>
                    <strong>Corpo:</strong>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      {template.body.substring(0, 200)}...
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EmailSettings; 