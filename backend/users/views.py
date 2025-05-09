from django.shortcuts import render
from rest_framework.views import APIView,api_view
from rest_framework.response import Response


from .serializers import SumInputSerializer

class SumView(APIView):
    def post(self, request):
        serializer = SumInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        a = serializer.validated_data['a']
        b = serializer.validated_data['b']
        
        
        result = a + b
        return Response({'result': result})
    
    def get(self, request):
        print(request.data)
        
        
        result = "a"
        return Response({'result': result})
    
@api_view(['GET'])
def ping(request):
    result = "b"
    return Response({'result': result})