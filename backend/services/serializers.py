from rest_framework import serializers

class addServiceSerializer(serializers.Serializer):
    srv_image = serializers.CharField(required=True)
    srv_name = serializers.CharField(required=True)
    srv_ip = serializers.CharField(required=True)
    srv_desc = serializers.CharField(required=True)
    
class updateServiceSerializer(serializers.Serializer):
    srv_id = serializers.CharField(required=True)
    srv_image = serializers.CharField(required=False)
    srv_name = serializers.CharField(required=False)
    srv_ip = serializers.CharField(required=False)
    srv_desc = serializers.CharField(required=False)


