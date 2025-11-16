'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.materials': 'My Materials',
    'nav.notifications': 'Notifications',
    'nav.generate': 'Generate New',
    'nav.settings': 'Settings',

    // Common
    'common.loading': 'Loading...',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.close': 'Close',
    'common.logout': 'Logout',

    // Materials
    'materials.title': 'My Materials',
    'materials.noMaterials': 'No materials yet',
    'materials.startGenerating': 'Start by generating your first study material',
    'materials.generateNew': 'Generate New Material',
    'materials.selectMaterial': 'Select a material',
    'materials.chooseFromList': 'Choose a material from the list to view its content',
    'materials.sharedWithYou': 'Shared with you',

    // Generate
    'generate.title': 'Generate New Material',
    'generate.upload': 'Upload Study Materials',
    'generate.uploadedFiles': 'Uploaded Files',
    'generate.processingOptions': 'Processing Options',
    'generate.materialTitle': 'Material Title',
    'generate.titlePlaceholder': 'Enter a title or leave blank for auto-detection',
    'generate.titleHint': 'AI will suggest a title based on your files if left blank',
    'generate.outputLanguage': 'Output Language',
    'generate.languageHint': 'AI will generate summaries, questions, and explanations in the selected language',
    'generate.features': 'Features to Generate',
    'generate.featuresHint': 'All features are automatically generated. You can customize the study plan difficulty below.',
    'generate.studyPlanDifficulty': 'Study Plan Difficulty',
    'generate.difficulty.easy': 'Easy',
    'generate.difficulty.medium': 'Medium',
    'generate.difficulty.hard': 'Hard',
    'generate.process': 'Generate Study Material',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.noNotifications': 'No notifications',
    'notifications.emptyMessage': 'You\'ll see notifications here when someone shares materials with you',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.markAsRead': 'Mark as read',
    'notifications.sharedBy': 'Shared by',
    'notifications.material': 'Material',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.selectLanguage': 'Select your preferred language',

    // Share Modal
    'share.title': 'Share Material',
    'share.description': 'Share "{title}" with friends or colleagues',
    'share.selectedUsers': 'Selected Users',
    'share.searchUsers': 'Search Users by Email',
    'share.searchPlaceholder': 'Type email to search...',
    'share.noUsersFound': 'No users found matching "{query}"',
    'share.shareWith': 'Share with {count} user(s)',
    'share.sharing': 'Sharing...',

    // Study Material View
    'material.summary': 'Summary',
    'material.keyPoints': 'Key Points',
    'material.formulas': 'Formulas',
    'material.questions': 'Questions',
    'material.mcqs': 'MCQs',
    'material.flashcards': 'Flashcards',
    'material.studyPlan': 'Study Plan',
    'material.videos': 'Videos',
    'material.pdf': 'PDF',
    'material.chapters': 'Chapters',
    'material.chapter': 'Chapter',
    'material.showAnswer': 'Show Answer',
    'material.hideAnswer': 'Hide Answer',
    'material.noFormulas': 'No formulas exist in this chapter.',
    'material.flip': 'Flip',
    'material.next': 'Next',
    'material.previous': 'Previous',
    'material.day': 'Day',
    'material.remove': 'Remove',
    'material.editTitle': 'Edit title',
    'material.deleteTitle': 'Delete material',
    'material.confirmDelete': 'Are you sure you want to delete this material? This action cannot be undone.',
    'material.deleting': 'Deleting...',
    'material.processing': 'Processing',
    'material.extracted': 'Extracted',
    'material.characters': 'characters',
    'material.readingAnalyzing': 'Reading and analyzing document content. This will be processed by AI shortly...',
    'material.extractingFrom': 'Extracting text from',

    // File Upload
    'upload.dropFiles': 'Drop files here...',
    'upload.dragDrop': 'Drag & drop files here, or click to browse',
    'upload.fileTypes': 'PDF, Word, PowerPoint, Text files • Max 50MB per file',
    'upload.selectedFiles': 'Selected Files',
    'upload.clearAll': 'Clear All',
    'upload.uploading': 'Uploading...',
    'upload.uploadFiles': 'Upload {count} file(s)',
    'upload.selectFile': 'Please select at least one file',
    'upload.failed': 'Upload failed',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back! 👋',
    'dashboard.ready': 'Ready to create your next study material? Upload your files and let AI do the work.',
    'dashboard.generateNew': 'Generate New Material',
    'dashboard.uploadProcess': 'Upload and process files',
    'dashboard.uploadDescription': 'Upload PDFs, Word documents, or PowerPoint files and generate summaries, questions, flashcards, and more.',
    'dashboard.myMaterials': 'My Materials',
    'dashboard.savedMaterials': '{count} saved materials',
    'dashboard.viewManage': 'View and manage all your processed study materials, flashcards, and study plans.',
    'dashboard.totalMaterials': 'Total Materials',
    'dashboard.processed': 'Processed',
    'dashboard.flashcards': 'Flashcards',
    'dashboard.recentMaterials': 'Recent Materials',
    'dashboard.viewAll': 'View All →',

    // Materials
    'materials.newMaterial': '+ New Material',
    'materials.showList': 'Show Materials List',
    'materials.hideList': 'Hide list',
    'materials.materials': 'Materials',
    'materials.search': 'Search materials...',
    'materials.clickArrow': 'Click the arrow button to show materials list',

    // Generate
    'generate.processing': 'Processing Your Materials',
    'generate.extracting': 'Extracting content from files...',
    'generate.processingFile': 'Processing File:',
    'generate.contentFrom': 'Content from:',
    'generate.readingAnalyzing': 'Reading and analyzing document content. This will be processed by AI shortly...',
    'generate.extractingFrom': 'Extracting text from',
    'generate.fileTypes': 'PDF, Word, PowerPoint',
    'generate.remove': 'Remove',
    'generate.featureSummary': '✓ 📄 Summary',
    'generate.featureKeyPoints': '✓ 🔑 Key Points',
    'generate.featureFormulas': '✓ 🔢 Formulas',
    'generate.featureQuestions': '✓ ❓ Questions',
    'generate.featureMCQs': '✓ 📝 MCQs',
    'generate.featureFlashcards': '✓ 🎴 Flashcards',
    'generate.featureStudyPlan': '✓ 📅 Study Plan',

    // Processing Loader
    'processing.title': 'Generating Study Material...',
    'processing.readingFiles': 'Reading files',
    'processing.extractingText': 'Extracting text content',
    'processing.analyzingStructure': 'Analyzing document structure',
    'processing.processingAI': 'Processing with AI',
    'processing.generatingSummaries': 'Generating summaries',
    'processing.creatingKeyPoints': 'Creating key points',
    'processing.extractingFormulas': 'Extracting formulas',
    'processing.generatingQuestions': 'Generating questions',
    'processing.creatingMCQs': 'Creating MCQs',
    'processing.buildingFlashcards': 'Building flashcards',
    'processing.creatingStudyPlan': 'Creating study plan',
    'processing.finalizing': 'Finalizing',
    'processing.currentStatus': 'Current Status:',
    'processing.extractedPreview': 'Extracted Text Preview:',

    // Share Modal
    'share.enterEmail': 'Please enter an email address',
    'share.validEmail': 'Please enter a valid email address',
    'share.selectUser': 'Please select at least one user to share with',
    'share.success': 'Material shared successfully!',
    'share.failed': 'Failed to share material',
    'share.alreadyShared': 'Material is already shared with this user',
    'share.userNotFound': 'User not found with this email. Make sure the user has an account.',
    'share.cannotShareSelf': 'You cannot share a material with yourself',

    // Notifications
    'notifications.clickToView': 'Click to view material',

    // Errors
    'error.uploadFailed': 'Upload failed',
    'error.processingFailed': 'Processing failed',
    'error.unknown': 'An unknown error occurred',
    'error.unauthorized': 'Unauthorized',
    'error.notFound': 'Not found',
  },
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.materials': 'Mes Matériels',
    'nav.notifications': 'Notifications',
    'nav.generate': 'Générer Nouveau',
    'nav.settings': 'Paramètres',

    // Common
    'common.loading': 'Chargement...',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.share': 'Partager',
    'common.close': 'Fermer',
    'common.logout': 'Déconnexion',

    // Materials
    'materials.title': 'Mes Matériels',
    'materials.noMaterials': 'Aucun matériel pour le moment',
    'materials.startGenerating': 'Commencez par générer votre premier matériel d\'étude',
    'materials.generateNew': 'Générer Nouveau Matériel',
    'materials.selectMaterial': 'Sélectionner un matériel',
    'materials.chooseFromList': 'Choisissez un matériel dans la liste pour voir son contenu',
    'materials.sharedWithYou': 'Partagé avec vous',

    // Generate
    'generate.title': 'Générer Nouveau Matériel',
    'generate.upload': 'Télécharger des Matériels d\'Étude',
    'generate.uploadedFiles': 'Fichiers Téléchargés',
    'generate.processingOptions': 'Options de Traitement',
    'generate.materialTitle': 'Titre du Matériel',
    'generate.titlePlaceholder': 'Entrez un titre ou laissez vide pour la détection automatique',
    'generate.titleHint': 'L\'IA suggérera un titre basé sur vos fichiers si laissé vide',
    'generate.outputLanguage': 'Langue de Sortie',
    'generate.languageHint': 'L\'IA générera des résumés, questions et explications dans la langue sélectionnée',
    'generate.features': 'Fonctionnalités à Générer',
    'generate.featuresHint': 'Toutes les fonctionnalités sont générées automatiquement. Vous pouvez personnaliser la difficulté du plan d\'étude ci-dessous.',
    'generate.studyPlanDifficulty': 'Difficulté du Plan d\'Étude',
    'generate.difficulty.easy': 'Facile',
    'generate.difficulty.medium': 'Moyen',
    'generate.difficulty.hard': 'Difficile',
    'generate.process': 'Générer le Matériel d\'Étude',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.noNotifications': 'Aucune notification',
    'notifications.emptyMessage': 'Vous verrez des notifications ici lorsque quelqu\'un partagera des matériels avec vous',
    'notifications.markAllRead': 'Tout marquer comme lu',
    'notifications.markAsRead': 'Marquer comme lu',
    'notifications.sharedBy': 'Partagé par',
    'notifications.material': 'Matériel',

    // Settings
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.selectLanguage': 'Sélectionnez votre langue préférée',

    // Share Modal
    'share.title': 'Partager le Matériel',
    'share.description': 'Partager "{title}" avec des amis ou collègues',
    'share.selectedUsers': 'Utilisateurs Sélectionnés',
    'share.searchUsers': 'Rechercher des Utilisateurs par Email',
    'share.searchPlaceholder': 'Tapez un email pour rechercher...',
    'share.noUsersFound': 'Aucun utilisateur trouvé correspondant à "{query}"',
    'share.shareWith': 'Partager avec {count} utilisateur(s)',
    'share.sharing': 'Partage...',

    // Study Material View
    'material.summary': 'Résumé',
    'material.keyPoints': 'Points Clés',
    'material.formulas': 'Formules',
    'material.questions': 'Questions',
    'material.mcqs': 'Questions à Choix Multiples',
    'material.flashcards': 'Cartes Mémoire',
    'material.studyPlan': 'Plan d\'Étude',
    'material.videos': 'Vidéos',
    'material.pdf': 'PDF',
    'material.chapters': 'Chapitres',
    'material.chapter': 'Chapitre',
    'material.showAnswer': 'Afficher la Réponse',
    'material.hideAnswer': 'Masquer la Réponse',
    'material.noFormulas': 'Aucune formule n\'existe dans ce chapitre.',
    'material.flip': 'Retourner',
    'material.next': 'Suivant',
    'material.previous': 'Précédent',
    'material.day': 'Jour',
    'material.remove': 'Supprimer',
    'material.editTitle': 'Modifier le titre',
    'material.deleteTitle': 'Supprimer le matériel',
    'material.confirmDelete': 'Êtes-vous sûr de vouloir supprimer ce matériel ? Cette action ne peut pas être annulée.',
    'material.deleting': 'Suppression...',
    'material.processing': 'Traitement',
    'material.extracted': 'Extrait',
    'material.characters': 'caractères',
    'material.readingAnalyzing': 'Lecture et analyse du contenu du document. Ce sera traité par l\'IA sous peu...',
    'material.extractingFrom': 'Extraction du texte depuis',

    // File Upload
    'upload.dropFiles': 'Déposez les fichiers ici...',
    'upload.dragDrop': 'Glissez-déposez les fichiers ici, ou cliquez pour parcourir',
    'upload.fileTypes': 'PDF, Word, PowerPoint, Fichiers texte • Max 50 Mo par fichier',
    'upload.selectedFiles': 'Fichiers Sélectionnés',
    'upload.clearAll': 'Tout Effacer',
    'upload.uploading': 'Téléchargement...',
    'upload.uploadFiles': 'Télécharger {count} fichier(s)',
    'upload.selectFile': 'Veuillez sélectionner au moins un fichier',
    'upload.failed': 'Échec du téléchargement',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.welcome': 'Bon retour ! 👋',
    'dashboard.ready': 'Prêt à créer votre prochain matériel d\'étude ? Téléchargez vos fichiers et laissez l\'IA faire le travail.',
    'dashboard.generateNew': 'Générer Nouveau Matériel',
    'dashboard.uploadProcess': 'Télécharger et traiter les fichiers',
    'dashboard.uploadDescription': 'Téléchargez des PDF, documents Word ou fichiers PowerPoint et générez des résumés, questions, cartes mémoire et plus encore.',
    'dashboard.myMaterials': 'Mes Matériels',
    'dashboard.savedMaterials': '{count} matériels enregistrés',
    'dashboard.viewManage': 'Visualisez et gérez tous vos matériels d\'étude traités, cartes mémoire et plans d\'étude.',
    'dashboard.totalMaterials': 'Total des Matériels',
    'dashboard.processed': 'Traité',
    'dashboard.flashcards': 'Cartes Mémoire',
    'dashboard.recentMaterials': 'Matériels Récents',
    'dashboard.viewAll': 'Voir Tout →',

    // Materials
    'materials.newMaterial': '+ Nouveau Matériel',
    'materials.showList': 'Afficher la Liste des Matériels',
    'materials.hideList': 'Masquer la liste',
    'materials.materials': 'Matériels',
    'materials.search': 'Rechercher des matériels...',
    'materials.clickArrow': 'Cliquez sur le bouton flèche pour afficher la liste des matériels',

    // Generate
    'generate.processing': 'Traitement de Vos Matériels',
    'generate.extracting': 'Extraction du contenu des fichiers...',
    'generate.processingFile': 'Traitement du Fichier:',
    'generate.contentFrom': 'Contenu depuis:',
    'generate.readingAnalyzing': 'Lecture et analyse du contenu du document. Ce sera traité par l\'IA sous peu...',
    'generate.extractingFrom': 'Extraction du texte depuis',
    'generate.fileTypes': 'PDF, Word, PowerPoint',
    'generate.remove': 'Supprimer',
    'generate.featureSummary': '✓ 📄 Résumé',
    'generate.featureKeyPoints': '✓ 🔑 Points Clés',
    'generate.featureFormulas': '✓ 🔢 Formules',
    'generate.featureQuestions': '✓ ❓ Questions',
    'generate.featureMCQs': '✓ 📝 QCM',
    'generate.featureFlashcards': '✓ 🎴 Cartes Mémoire',
    'generate.featureStudyPlan': '✓ 📅 Plan d\'Étude',

    // Processing Loader
    'processing.title': 'Génération du Matériel d\'Étude...',
    'processing.readingFiles': 'Lecture des fichiers',
    'processing.extractingText': 'Extraction du contenu texte',
    'processing.analyzingStructure': 'Analyse de la structure du document',
    'processing.processingAI': 'Traitement avec l\'IA',
    'processing.generatingSummaries': 'Génération des résumés',
    'processing.creatingKeyPoints': 'Création des points clés',
    'processing.extractingFormulas': 'Extraction des formules',
    'processing.generatingQuestions': 'Génération des questions',
    'processing.creatingMCQs': 'Création des QCM',
    'processing.buildingFlashcards': 'Construction des cartes mémoire',
    'processing.creatingStudyPlan': 'Création du plan d\'étude',
    'processing.finalizing': 'Finalisation',
    'processing.currentStatus': 'Statut Actuel:',
    'processing.extractedPreview': 'Aperçu du Texte Extrait:',

    // Share Modal
    'share.enterEmail': 'Veuillez entrer une adresse e-mail',
    'share.validEmail': 'Veuillez entrer une adresse e-mail valide',
    'share.selectUser': 'Veuillez sélectionner au moins un utilisateur avec qui partager',
    'share.success': 'Matériel partagé avec succès !',
    'share.failed': 'Échec du partage du matériel',
    'share.alreadyShared': 'Le matériel est déjà partagé avec cet utilisateur',
    'share.userNotFound': 'Utilisateur non trouvé avec cet e-mail. Assurez-vous que l\'utilisateur a un compte.',
    'share.cannotShareSelf': 'Vous ne pouvez pas partager un matériel avec vous-même',

    // Notifications
    'notifications.clickToView': 'Cliquez pour voir le matériel',

    // Errors
    'error.uploadFailed': 'Échec du téléchargement',
    'error.processingFailed': 'Échec du traitement',
    'error.unknown': 'Une erreur inconnue s\'est produite',
    'error.unauthorized': 'Non autorisé',
    'error.notFound': 'Non trouvé',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.materials': 'موادي',
    'nav.notifications': 'الإشعارات',
    'nav.generate': 'إنشاء جديد',
    'nav.settings': 'الإعدادات',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.share': 'مشاركة',
    'common.close': 'إغلاق',
    'common.logout': 'تسجيل الخروج',

    // Materials
    'materials.title': 'موادي',
    'materials.noMaterials': 'لا توجد مواد بعد',
    'materials.startGenerating': 'ابدأ بإنشاء مادة الدراسة الأولى',
    'materials.generateNew': 'إنشاء مادة جديدة',
    'materials.selectMaterial': 'اختر مادة',
    'materials.chooseFromList': 'اختر مادة من القائمة لعرض محتواها',
    'materials.sharedWithYou': 'مشاركة معك',

    // Generate
    'generate.title': 'إنشاء مادة جديدة',
    'generate.upload': 'رفع مواد الدراسة',
    'generate.uploadedFiles': 'الملفات المرفوعة',
    'generate.processingOptions': 'خيارات المعالجة',
    'generate.materialTitle': 'عنوان المادة',
    'generate.titlePlaceholder': 'أدخل عنواناً أو اتركه فارغاً للكشف التلقائي',
    'generate.titleHint': 'سيقترح الذكاء الاصطناعي عنواناً بناءً على ملفاتك إذا تركتها فارغة',
    'generate.outputLanguage': 'لغة الإخراج',
    'generate.languageHint': 'سيولد الذكاء الاصطناعي الملخصات والأسئلة والتفسيرات باللغة المختارة',
    'generate.features': 'الميزات المطلوب إنشاؤها',
    'generate.featuresHint': 'يتم إنشاء جميع الميزات تلقائياً. يمكنك تخصيص صعوبة خطة الدراسة أدناه.',
    'generate.studyPlanDifficulty': 'صعوبة خطة الدراسة',
    'generate.difficulty.easy': 'سهل',
    'generate.difficulty.medium': 'متوسط',
    'generate.difficulty.hard': 'صعب',
    'generate.process': 'إنشاء مادة الدراسة',

    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.noNotifications': 'لا توجد إشعارات',
    'notifications.emptyMessage': 'سترى الإشعارات هنا عندما يشارك شخص ما مواد معك',
    'notifications.markAllRead': 'تحديد الكل كمقروء',
    'notifications.markAsRead': 'تحديد كمقروء',
    'notifications.sharedBy': 'مشارك من قبل',
    'notifications.material': 'المادة',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'settings.selectLanguage': 'اختر لغتك المفضلة',

    // Share Modal
    'share.title': 'مشاركة المادة',
    'share.description': 'شارك "{title}" مع الأصدقاء أو الزملاء',
    'share.selectedUsers': 'المستخدمون المحددون',
    'share.searchUsers': 'البحث عن المستخدمين بالبريد الإلكتروني',
    'share.searchPlaceholder': 'اكتب البريد الإلكتروني للبحث...',
    'share.noUsersFound': 'لم يتم العثور على مستخدمين يطابقون "{query}"',
    'share.shareWith': 'مشاركة مع {count} مستخدم',
    'share.sharing': 'جاري المشاركة...',

    // Study Material View
    'material.summary': 'الملخص',
    'material.keyPoints': 'النقاط الرئيسية',
    'material.formulas': 'الصيغ',
    'material.questions': 'الأسئلة',
    'material.mcqs': 'الأسئلة متعددة الخيارات',
    'material.flashcards': 'البطاقات التعليمية',
    'material.studyPlan': 'خطة الدراسة',
    'material.videos': 'الفيديوهات',
    'material.chapters': 'الفصول',
    'material.chapter': 'الفصل',
    'material.showAnswer': 'إظهار الإجابة',
    'material.hideAnswer': 'إخفاء الإجابة',
    'material.noFormulas': 'لا توجد صيغ في هذا الفصل.',
    'material.flip': 'قلب',
    'material.next': 'التالي',
    'material.previous': 'السابق',
    'material.day': 'يوم',
    'material.remove': 'إزالة',
    'material.editTitle': 'تعديل العنوان',
    'material.deleteTitle': 'حذف المادة',
    'material.confirmDelete': 'هل أنت متأكد من حذف هذه المادة؟ لا يمكن التراجع عن هذا الإجراء.',
    'material.deleting': 'جاري الحذف...',
    'material.processing': 'جاري المعالجة',
    'material.extracted': 'مستخرج',
    'material.characters': 'حرف',
    'material.readingAnalyzing': 'قراءة وتحليل محتوى المستند. سيتم معالجته بواسطة الذكاء الاصطناعي قريباً...',
    'material.extractingFrom': 'استخراج النص من',

    // File Upload
    'upload.dropFiles': 'أسقط الملفات هنا...',
    'upload.dragDrop': 'اسحب وأفلت الملفات هنا، أو انقر للتصفح',
    'upload.fileTypes': 'PDF، Word، PowerPoint، ملفات نصية • الحد الأقصى 50 ميجابايت لكل ملف',
    'upload.selectedFiles': 'الملفات المحددة',
    'upload.clearAll': 'مسح الكل',
    'upload.uploading': 'جاري الرفع...',
    'upload.uploadFiles': 'رفع {count} ملف',
    'upload.selectFile': 'يرجى تحديد ملف واحد على الأقل',
    'upload.failed': 'فشل الرفع',

    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'مرحباً بعودتك! 👋',
    'dashboard.ready': 'هل أنت مستعد لإنشاء مادة الدراسة التالية؟ ارفع ملفاتك ودع الذكاء الاصطناعي يقوم بالعمل.',
    'dashboard.generateNew': 'إنشاء مادة جديدة',
    'dashboard.uploadProcess': 'رفع ومعالجة الملفات',
    'dashboard.uploadDescription': 'ارفع ملفات PDF أو مستندات Word أو ملفات PowerPoint وأنشئ ملخصات وأسئلة وبطاقات تعليمية والمزيد.',
    'dashboard.myMaterials': 'موادي',
    'dashboard.savedMaterials': '{count} مادة محفوظة',
    'dashboard.viewManage': 'عرض وإدارة جميع مواد الدراسة المعالجة والبطاقات التعليمية وخطط الدراسة.',
    'dashboard.totalMaterials': 'إجمالي المواد',
    'dashboard.processed': 'معالج',
    'dashboard.flashcards': 'البطاقات التعليمية',
    'dashboard.recentMaterials': 'المواد الأخيرة',
    'dashboard.viewAll': 'عرض الكل →',

    // Materials
    'materials.newMaterial': '+ مادة جديدة',
    'materials.showList': 'إظهار قائمة المواد',
    'materials.hideList': 'إخفاء القائمة',
    'materials.materials': 'المواد',
    'materials.search': 'البحث عن المواد...',
    'materials.clickArrow': 'انقر على زر السهم لإظهار قائمة المواد',

    // Generate
    'generate.processing': 'معالجة موادك',
    'generate.extracting': 'استخراج المحتوى من الملفات...',
    'generate.processingFile': 'معالجة الملف:',
    'generate.contentFrom': 'المحتوى من:',
    'generate.readingAnalyzing': 'قراءة وتحليل محتوى المستند. سيتم معالجته بواسطة الذكاء الاصطناعي قريباً...',
    'generate.extractingFrom': 'استخراج النص من',
    'generate.fileTypes': 'PDF، Word، PowerPoint',
    'generate.remove': 'إزالة',
    'generate.featureSummary': '✓ 📄 الملخص',
    'generate.featureKeyPoints': '✓ 🔑 النقاط الرئيسية',
    'generate.featureFormulas': '✓ 🔢 الصيغ',
    'generate.featureQuestions': '✓ ❓ الأسئلة',
    'generate.featureMCQs': '✓ 📝 الأسئلة متعددة الخيارات',
    'generate.featureFlashcards': '✓ 🎴 البطاقات التعليمية',
    'generate.featureStudyPlan': '✓ 📅 خطة الدراسة',

    // Processing Loader
    'processing.title': 'إنشاء مادة الدراسة...',
    'processing.readingFiles': 'قراءة الملفات',
    'processing.extractingText': 'استخراج المحتوى النصي',
    'processing.analyzingStructure': 'تحليل بنية المستند',
    'processing.processingAI': 'المعالجة بالذكاء الاصطناعي',
    'processing.generatingSummaries': 'إنشاء الملخصات',
    'processing.creatingKeyPoints': 'إنشاء النقاط الرئيسية',
    'processing.extractingFormulas': 'استخراج الصيغ',
    'processing.generatingQuestions': 'إنشاء الأسئلة',
    'processing.creatingMCQs': 'إنشاء الأسئلة متعددة الخيارات',
    'processing.buildingFlashcards': 'بناء البطاقات التعليمية',
    'processing.creatingStudyPlan': 'إنشاء خطة الدراسة',
    'processing.finalizing': 'الإنهاء',
    'processing.currentStatus': 'الحالة الحالية:',
    'processing.extractedPreview': 'معاينة النص المستخرج:',

    // Share Modal
    'share.enterEmail': 'يرجى إدخال عنوان بريد إلكتروني',
    'share.validEmail': 'يرجى إدخال عنوان بريد إلكتروني صحيح',
    'share.selectUser': 'يرجى تحديد مستخدم واحد على الأقل للمشاركة معه',
    'share.success': 'تم مشاركة المادة بنجاح!',
    'share.failed': 'فشلت مشاركة المادة',
    'share.alreadyShared': 'المادة مشاركة بالفعل مع هذا المستخدم',
    'share.userNotFound': 'لم يتم العثور على مستخدم بهذا البريد الإلكتروني. تأكد من أن المستخدم لديه حساب.',
    'share.cannotShareSelf': 'لا يمكنك مشاركة مادة مع نفسك',

    // Notifications
    'notifications.clickToView': 'انقر لعرض المادة',

    // Errors
    'error.uploadFailed': 'فشل الرفع',
    'error.processingFailed': 'فشلت المعالجة',
    'error.unknown': 'حدث خطأ غير معروف',
    'error.unauthorized': 'غير مصرح',
    'error.notFound': 'غير موجود',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' to prevent hydration mismatch
  // We'll update from localStorage after mount (client-side only)
  const [language, setLanguageState] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);

  // Load language from localStorage after mount (client-side only)
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appLanguage');
      if (saved === 'fr' || saved === 'en' || saved === 'ar') {
        setLanguageState(saved);
      }
    }
  }, []);

  // Save language to localStorage when it changes (only after client mount)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', language);
    }
  }, [language, isClient]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;

    // Replace placeholders like {count}, {title}, etc.
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

